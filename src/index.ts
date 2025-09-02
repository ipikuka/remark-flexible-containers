import { visit, CONTINUE } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type {
  BlockContent,
  Data,
  Node,
  Paragraph,
  Parent,
  PhrasingContent,
  Root,
  Text,
} from "mdast";
import { u } from "unist-builder";
import { findAfter } from "unist-util-find-after";
import { findAllBetween } from "unist-util-find-between-all";

type Prettify<T> = { [K in keyof T]: T[K] } & {};
type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ContainerData extends Data {}

interface Container extends Parent {
  type: "container";
  children: BlockContent[];
  data?: ContainerData | undefined;
}

declare module "mdast" {
  interface BlockContentMap {
    container: Container;
  }

  interface RootContentMap {
    container: Container;
  }
}

interface HProperties {
  id?: string;
  className?: string[];
  [key: string]: unknown;
}

type TitleFunction = (type?: string, title?: string) => string | null | undefined;
type TagNameFunction = (type?: string, title?: string) => string;
type ClassNameFunction = (type?: string, title?: string) => string[];
type PropertyFunction = (type?: string, title?: string) => HPropertiesInput;
type HPropertiesInput = Record<string, unknown> & { className?: never };

export type FlexibleContainerOptions = {
  title?: TitleFunction;
  containerTagName?: string | TagNameFunction;
  containerClassName?: string | ClassNameFunction;
  containerProperties?: PropertyFunction;
  titleTagName?: string | TagNameFunction;
  titleClassName?: string | ClassNameFunction;
  titleProperties?: PropertyFunction;
};

const DEFAULT_SETTINGS: FlexibleContainerOptions = {
  containerTagName: "div",
  containerClassName: "remark-container",
  titleTagName: "div",
  titleClassName: "remark-container-title",
};

type PartiallyRequiredFlexibleContainerOptions = Prettify<
  PartiallyRequired<
    FlexibleContainerOptions,
    "containerTagName" | "containerClassName" | "titleTagName" | "titleClassName"
  >
>;

// ---- Type Predicates ---------------------------------------------------------------

function is<T extends Node>(node: Node, type: string): node is T {
  return node.type === type;
}

// ---- Regexes ---------------------------------------------------------------

// Capture colons >=3 (opening fence), optional type, optional title (trailing spaces NOT allowed)
export const REGEX_START = /^(:{3,})\s*([\w-]+)?\s*(.*[^ \n])?/u;

// Generic end matcher (any fence >=3 colons at end), no need capturing the length of colons
export const REGEX_END = /\s*\n*?:{3,}$/;
// actual closing detection is done dynamically per fence length
const get_REGEX_END = (fence: string) => new RegExp(`\\s*\\n*?${fence}$`);

// for gating for bad syntax
export const REGEX_BAD_SYNTAX = /^:{3,}\s*\n+\s*:{3,}\s*.*/;
// actual bad syntax detection is done dynamically per same fence length
const get_REGEX_BAD_SYNTAX = (fence: string) =>
  new RegExp(`^${fence}\\s*\\n+\\s*${fence}\\s*.*`);

// to find specific identifiers in curly braces --> {article#foo} Title {span.bar}
export const REGEX_CUSTOM = /(\{[^{}]*\})?(\s*[^{}]*\s*)?(\{[^{}]*\})?/u;

/**
 *
 * This plugin adds container node with customizable properties in order to produce container element like callouts and admonitions
 *
 * for example:
 *
 * ::: warning My Title
 * Content with **bold text**
 * :::
 *
 */
export const plugin: Plugin<[FlexibleContainerOptions?], Root> = (options) => {
  const settings = Object.assign(
    {},
    DEFAULT_SETTINGS,
    options,
  ) as PartiallyRequiredFlexibleContainerOptions;

  // ---- Helpers ----------------------------------------------------------

  const REVISIT = (i: number) => i;

  /**
   *
   * normalize specific identifiers "{section#id.classname}" --> "section #id .classname"
   *
   */
  function normalizeIdentifiers(input?: string): string | undefined {
    return input
      ?.replace(/[{}]/g, "")
      .replace(/\./g, " .")
      .replace(/#/g, " #")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   *
   * if the paragraph has one child,
   * check weather it has only one Text child and its value is empty string
   *
   */
  function checkParagraphWithEmptyText(node: Paragraph): boolean {
    return (
      node.children.length === 1 &&
      node.children[0].type === "text" &&
      node.children[0].value === ""
    );
  }

  /**
   *
   * if the first child of paragraph children is "break", then remove that child
   *
   */
  function removeFirstBreakInPlace(node: Paragraph): undefined {
    if (node.children[0].type === "break") {
      node.children.shift();
    }
  }

  /**
   *
   * merge properties
   *
   */
  function mergeProperties(
    id?: string,
    classname?: string[],
    baseProperties?: HPropertiesInput,
  ): HProperties {
    const properties: HProperties = {};

    if (id) properties.id = id;

    if (classname?.length) {
      properties.className = [...classname];
    }

    if (baseProperties) {
      for (const [k, v] of Object.entries(baseProperties)) {
        if (k === "className") continue; // never accept className from settings-Properties
        if (typeof v === "string" && v === "") continue;
        if (Array.isArray(v) && (v as unknown[]).length === 0) continue;
        properties[k] = v;
      }
    }

    return properties;
  }

  // ---- Constructors And Utils -------------------------------------------------------

  const constructTitle = (
    type?: string,
    title?: string,
    props?: string[],
  ): Paragraph | undefined => {
    const _type = type?.toLowerCase();
    const _title = title?.replace(/\s+/g, " ");
    const optionTitle = settings.title?.(_type, _title);

    // if the option is `title: () => null`, suppress title unless explicit props exist
    if (!props && optionTitle === null && _type !== "details") return;

    const mainTitle = optionTitle ?? _title ?? (_type === "details" ? "Details" : undefined);
    if (!mainTitle) return;

    const titleTagName =
      typeof settings.titleTagName === "string"
        ? _type === "details"
          ? "summary"
          : settings.titleTagName
        : settings.titleTagName(_type, _title);

    const titleClassName =
      typeof settings.titleClassName === "string"
        ? _type === "details"
          ? ["remark-summary"]
          : [settings.titleClassName, _type ?? ""]
        : settings.titleClassName(_type, _title);

    // props may contain specific identifiers (tagname, id, classnames) specific to this title node
    const specificTagName = props?.find((p) => /^[^#.]/.test(p));
    const specificId = props?.find((p) => p.startsWith("#"))?.slice(1);
    const specificClassName = props?.filter((p) => p.startsWith("."))?.map((p) => p.slice(1));

    const mergedClassName = [...titleClassName, ...(specificClassName ?? [])];
    const baseProps = settings.titleProperties?.(_type, _title);

    return {
      type: "paragraph",
      children: [{ type: "text", value: mainTitle }],
      data: {
        hName: specificTagName ?? titleTagName,
        hProperties: mergeProperties(specificId, mergedClassName, baseProps),
      },
    };
  };

  const constructContainer = (
    children: BlockContent[],
    type?: string,
    title?: string,
    props?: string[],
  ): Container => {
    const _type = type?.toLowerCase();
    const _title = title?.replace(/\s+/g, " ");

    const containerTagName =
      typeof settings.containerTagName === "string"
        ? _type === "details"
          ? "details"
          : settings.containerTagName
        : settings.containerTagName(_type, _title);

    const containerClassName =
      typeof settings.containerClassName === "string"
        ? _type === "details"
          ? ["remark-details"]
          : [settings.containerClassName, _type ?? ""]
        : settings.containerClassName(_type, _title);

    // props may contain specific identifiers (tagname, id, classnames) specific to this container node
    const specificTagName = props?.find((p) => /^[^#.]/.test(p));
    const specificId = props?.find((p) => p.startsWith("#"))?.slice(1);
    const specificClassName = props?.filter((p) => p.startsWith("."))?.map((p) => p.slice(1));

    const mergedClassName = [...containerClassName, ...(specificClassName ?? [])];
    const baseProps = settings.containerProperties?.(_type, _title);

    return {
      type: "container",
      children,
      data: {
        hName: specificTagName ?? containerTagName,
        hProperties: mergeProperties(specificId, mergedClassName, baseProps),
      },
    };
  };

  /**
   *
   * extract specific identifiers in curly braces for container and title nodes
   * ::: type {section#foo} title {span.bar}
   *
   */
  function extractSpecificIdentifiers(input?: string): {
    containerProps?: string[];
    title?: string;
    titleProps?: string[];
  } {
    if (!input) return {};

    const match = input.match(REGEX_CUSTOM);

    /* v8 ignore next */
    const [, containerFixture, mainTitle, titleFixture] = match ?? [undefined];

    const nContainerFixture = normalizeIdentifiers(containerFixture);
    const nMainTitle = normalizeIdentifiers(mainTitle);
    const nTitleFixture = normalizeIdentifiers(titleFixture);

    const containerProps =
      nContainerFixture && nContainerFixture !== "" ? nContainerFixture.split(" ") : undefined;

    const titleProps =
      nTitleFixture && nTitleFixture !== "" ? nTitleFixture.split(" ") : undefined;

    return { containerProps, title: nMainTitle || undefined, titleProps };
  }

  /**
   *
   * get the opening fence string (>=3 colons)
   * if present at the start of a paragraph’s first Text child and not “bad syntax”
   *
   */
  function getOpeningFence(node: Paragraph): string | undefined {
    const firstElement = node.children[0];

    if (firstElement.type !== "text") return;

    const match = firstElement.value.match(/^:{3,}/u);
    const fence = match ? match[0] : undefined;

    if (fence && get_REGEX_BAD_SYNTAX(fence).test(firstElement.value)) return;

    return fence;
  }

  /**
   *
   * Parses the initial line of a fence block to extract the type, title,
   * and the remaining content.
   *
   */
  function parseFenceTypeTitle(
    initialValue: string,
    fence: string,
  ): {
    type?: string;
    title?: string;
    rest?: string;
  } {
    let type: string | undefined;
    let title: string | undefined;

    if (!initialValue.includes("\n")) {
      const match = initialValue.match(REGEX_START);

      return { type: match![2], title: match![3], rest: undefined };
    }

    let value = initialValue
      .replace(new RegExp(`^${fence}`), "")
      // remove (space, tab) but exclude \r and \n in the beginning
      .replace(/^[^\S\r\n]+/, "");

    const nIndex = value.indexOf("\n");

    if (nIndex === 0) {
      // means that there is no "type" and "title"

      // remove the newline "\n" in the beginning
      value = value.slice(1);
    } else {
      // means that there is a "type" and/or a "title"

      // get the type and the title
      const params = value.substring(0, nIndex);
      const match = params.match(/([\w-]+)\s*(.*[^\n ])?/u); // two matching groups: the first word and the rest

      type = match![1];
      title = match![2];

      // remove upto newline "\n" (included) in the beginning, get the rest of the value
      value = value.slice(nIndex + 1); // extracted \n from the beginning
    }

    return { type, title, rest: value };
  }

  // ---- Analyzers ----------------------------------------------------------

  /**
   * {flag: "complete"} means it is complete, so the end marker ":::" is FOUND in the current node; and the current node is MUTATED
   * {flag: "mutated"} means the end marker ":::" is NOT FOUND in the current node; and the current node is MUTATED
   * {flag: "regular"} means it is a regular container starter; and the current node is NOT MUTATED
   */

  type AnalyzeFlag = "complete" | "mutated" | "regular";

  type AnalyzeResult = {
    flag: AnalyzeFlag;
    type?: string;
    rawtitle?: string;
  };

  /**
   *
   * Parses opening fence line; mutates the node’s children accordingly
   *
   * if the paragraph node has one child (as Text),
   * check whether the node has end marker ":::" or not (check completeness)
   *
   */
  function analyzeChild(node: Paragraph, fence: string): AnalyzeResult {
    const textElement = node.children[0] as Text; // it is guarenteed in "getOpeningFence"

    const { type, title, rest } = parseFenceTypeTitle(textElement.value, fence);

    if (!rest) {
      // It is regular container
      return { flag: "regular", type, rawtitle: title };
    }

    let flag: AnalyzeFlag;
    let remaining: string;

    if (rest.endsWith(fence)) {
      // the container ends within same paragraph's text node
      flag = "complete";
      remaining = rest.slice(0, -fence.length).trim(); // remove the "\n:::" at the end
    } else {
      // the container is opened but not closed in this text node
      flag = "mutated";
      remaining = rest;
    }

    textElement.value = remaining; // mutation

    return { flag, type, rawtitle: title };
  }

  /**
   *
   * Parses opening fence line; mutates the node’s children accordingly
   *
   * if the paragraph node has more than one child,
   * check whether the node's last child has end marker ":::" or not (check completeness)
   *
   */
  function analyzeChildren(node: Paragraph, fence: string): AnalyzeResult {
    const firstElement = node.children[0] as Text; // it is guarenteed in "getOpeningFence"

    let flag: AnalyzeFlag = "mutated"; // it has more children means it can not be "regular"
    const paragraphChildren: PhrasingContent[] = [];

    const { type, title, rest } = parseFenceTypeTitle(firstElement.value, fence);

    if (rest) {
      // mutate the first Phrase
      firstElement.value = rest;

      paragraphChildren.push(firstElement);
    }

    // push the Phrases after first Phrase up to last Phrase
    for (let i = 1; i < node.children.length - 1; i++) {
      paragraphChildren.push(node.children[i]);
    }

    const lastElement = node.children[node.children.length - 1];

    // check weather the paragraph has closing marker or not (check completeness)
    if (lastElement.type === "text" && lastElement.value.endsWith("\n" + fence)) {
      // the container ends within the same paragraph
      flag = "complete";

      // mutate the last Phrase
      lastElement.value = lastElement.value.slice(0, -(fence.length + 1));
    }

    paragraphChildren.push(lastElement);

    node.children = paragraphChildren; // mutation

    return { flag, type, rawtitle: title };
  }

  /**
   *
   * if the paragraph has one Text child,
   * check it has closing ":::" or not (check completeness)
   *
   */
  function analyzeClosingNode(node: Paragraph, fence: string): AnalyzeFlag {
    const { children } = node;
    const lastChild = children[children.length - 1];

    if (lastChild.type === "text") {
      if (children.length === 1 && lastChild.value === fence) {
        return "regular";
      }

      lastChild.value = lastChild.value.replace(get_REGEX_END(fence), "");

      if (!lastChild.value) {
        node.children.pop();
      }
    }

    if (children.length > 0) {
      return "mutated";
    } else {
      return "regular";
    }
  }

  const transformer: Transformer<Root> = (tree) => {
    // if a html node.value ends with a new line and colons >=3 like "\n:::", remove and carry it into a new paragraph
    visit(tree, "html", function (node, index, parent) {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;

      const match = node.value.match(/\n(:{3,})$/);
      if (!match) return;

      node.value = node.value.replace(new RegExp(`\\n${match[1]}$`), "");

      const p = u("paragraph", [u("text", "\n" + match[1])]);

      // add the paragraph after the html node, in order to the next visitor can catch the container node
      parent.children.splice(index + 1, 0, p);
    });

    // main visit
    visit(tree, "paragraph", function (node, index, parent) {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;

      const fence = getOpeningFence(node);
      if (!fence) return;

      const { flag, type, rawtitle } =
        node.children.length === 1
          ? analyzeChild(node, fence) // mutates the node
          : analyzeChildren(node, fence); // mutates the node

      const { containerProps, title, titleProps } = extractSpecificIdentifiers(
        rawtitle?.trim(),
      );

      if (flag === "complete") {
        // means that the container starts and ends within the same paragraph node

        const titleNode = constructTitle(type, title, titleProps);

        removeFirstBreakInPlace(node); // mutates the node

        const isParagraphWithEmptyText = checkParagraphWithEmptyText(node);

        // is the paragraph node has only one child with empty text, don't add that paragraph node as a child
        // meaningly, don't produce empty <p>
        const containerChildren = isParagraphWithEmptyText
          ? [...(titleNode ? [titleNode] : [])]
          : [...(titleNode ? [titleNode] : []), node];

        const containerNode = constructContainer(
          containerChildren,
          type,
          title,
          containerProps,
        );

        // place it the place of the current paragraph node
        parent.children.splice(index, 1, containerNode);

        return CONTINUE;
      }

      const openingNode = node;
      const openingFlag = flag;

      const closingNode = findAfter(parent, openingNode, function (node) {
        if (node.type !== "paragraph") return false;

        const pChildren = (node as Paragraph).children;
        const lastChild = pChildren[pChildren.length - 1];

        if (lastChild.type !== "text") return false;

        return Boolean(lastChild.value.match(get_REGEX_END(fence)));
      });

      if (!closingNode) return;

      // just for type predicate
      /* v8 ignore next */
      if (!is<Paragraph>(closingNode, "paragraph")) return;

      const closingFlag = analyzeClosingNode(closingNode, fence); // mutates the closingNode

      const containerChildren = findAllBetween(
        parent,
        openingNode,
        closingNode,
      ) as BlockContent[];

      if (openingFlag === "mutated") {
        containerChildren.unshift(openingNode);
      }

      if (closingFlag === "mutated") {
        containerChildren.push(closingNode);
      }

      // if there is no content and type do not construct the container
      if (!containerChildren.length && !type) return;

      // if there is no content but type, then continue to construct the container
      const titleNode = constructTitle(type, title, titleProps);

      if (titleNode) containerChildren.splice(0, 0, titleNode);

      const containerNode = constructContainer(containerChildren, type, title, containerProps);

      const { children } = parent;
      const openingIndex = children.indexOf(openingNode);
      const closingIndex = children.indexOf(closingNode);
      children.splice(openingIndex, closingIndex - openingIndex + 1, containerNode);

      // Revisit position where the new node was inserted (key for nesting, instead of returning CONTINUE;)
      return REVISIT(openingIndex);
    });
  };

  return transformer;
};

export default plugin;
