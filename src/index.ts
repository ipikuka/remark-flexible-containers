import { CONTINUE, visit } from "unist-util-visit";
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
  /**
   * Node type of mdast Mark.
   */
  type: "container";
  /**
   * Children of paragraph.
   */
  children: BlockContent[];
  /**
   * Data associated with the mdast paragraph.
   */
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

type TitleFunction = (type?: string, title?: string) => string | null | undefined;
type TagNameFunction = (type?: string, title?: string) => string;
type ClassNameFunction = (type?: string, title?: string) => string[];
type PropertyFunction = (type?: string, title?: string) => RestrictedRecord;
type RestrictedRecord = Record<string, unknown> & { className?: never };

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

// Opening fence: 3 or more colons, optional type, optional title (trailing spaces allowed)
export const REGEX_START = /^(:{3,})\s*([\w-]+)?\s*(.*\S)?\s*$/u;
// Generic end matcher (any fence >=3 colons at end). Note: actual closing detection is done dynamically per fence length.
export const REGEX_END = /\s*\n*?(::{3,})\s*$/u;
// Kept for backward-compat; not used for gating anymore.
export const REGEX_BAD_SYNTAX = /^:{3,}\s*\n+\s*:{3,}\s*.*/;

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

  const constructTitle = (
    type?: string,
    title?: string,
    props?: string[],
  ): Paragraph | undefined => {
    const _type = type?.toLowerCase();
    const _title = title?.replace(/\s+/g, " ");

    const _settingsTitle = settings.title?.(_type, _title);

    // if the option is `title: () => null`, then return; but props breaks the rule !
    if (!props && _settingsTitle === null) return;

    const mainTitle = _settingsTitle || _title;

    if (!mainTitle) return;

    // props may contain specific identifiers (tagname, id, classnames) specific to this title node
    const specificTagName = props?.filter((p) => /^[^#.]/.test(p))?.[0];
    const specificId = props?.filter((p) => p.startsWith("#"))?.[0]?.slice(1);
    const specificClassName = props?.filter((p) => p.startsWith("."))?.map((p) => p.slice(1));

    let properties: Record<string, unknown> | undefined;

    if (settings.titleProperties) {
      properties = settings.titleProperties(_type, _title);

      Object.entries(properties).forEach(([k, v]) => {
        if (
          (typeof v === "string" && v === "") ||
          (Array.isArray(v) && (v as unknown[]).length === 0)
        ) {
          if (properties) {
            properties[k] = undefined;
          }
        }

        if (k === "className") delete properties?.["className"];
      });
    }

    const titleTagName =
      typeof settings.titleTagName === "string"
        ? settings.titleTagName
        : settings.titleTagName(_type, _title);

    const titleClassName =
      typeof settings.titleClassName === "string"
        ? [settings.titleClassName, _type ?? ""]
        : [...settings.titleClassName(_type, _title)];

    return {
      type: "paragraph",
      children: [{ type: "text", value: mainTitle }],
      data: {
        hName: specificTagName ?? titleTagName,
        hProperties: {
          className: [...titleClassName, ...(specificClassName ?? [])],
          ...(properties && { ...properties }),
          ...(specificId && { id: specificId }),
        },
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

    // props may contain specific identifiers (tagname, id, classnames) specific to this container node
    const specificTagName = props?.filter((p) => /^[^#.]/.test(p))?.[0];
    const specificId = props?.filter((p) => p.startsWith("#"))?.[0]?.slice(1);
    const specificClassName = props?.filter((p) => p.startsWith("."))?.map((p) => p.slice(1));

    let properties: Record<string, unknown> | undefined;

    if (settings.containerProperties) {
      properties = settings.containerProperties(_type, _title);

      Object.entries(properties).forEach(([k, v]) => {
        if (
          (typeof v === "string" && v === "") ||
          (Array.isArray(v) && (v as unknown[]).length === 0)
        ) {
          if (properties) {
            properties[k] = undefined;
          }
        }

        if (k === "className") delete properties?.["className"];
      });
    }

    const containerTagName =
      typeof settings.containerTagName === "string"
        ? settings.containerTagName
        : settings.containerTagName(_type, _title);

    const containerClassName =
      typeof settings.containerClassName === "string"
        ? [settings.containerClassName, _type ?? ""]
        : [...settings.containerClassName(_type, _title)];

    return {
      type: "container",
      children,
      data: {
        hName: specificTagName ?? containerTagName,
        hProperties: {
          className: [...containerClassName, ...(specificClassName ?? [])],
          ...(properties && { ...properties }),
          ...(specificId && { id: specificId }),
        },
      },
    };
  };

  // Define a custom string method
  String.prototype.normalize = function () {
    return this?.replace(/[{}]/g, "")
      .replace(".", " .")
      .replace("#", " #")
      .replace(/\s+/g, " ")
      .trim();
  };

  /**
   * the matched title may contain specific identifiers for container and title node
   * in curly braces like: {section#foo} Title {span.bar}
   *
   */
  function getSpecificIdentifiers(input?: string): {
    containerProps: string[] | undefined;
    title: string | undefined;
    titleProps: string[] | undefined;
  } {
    if (!input) return { containerProps: undefined, title: undefined, titleProps: undefined };

    const match = input.match(REGEX_CUSTOM);

    /* eslint-disable */
    /* v8 ignore next */
    let [input_, containerFixture, mainTitle, titleFixture] = match ?? [undefined];
    /* eslint-enable */

    containerFixture = containerFixture?.normalize();

    const containerProps =
      containerFixture && containerFixture !== "" ? containerFixture?.split(" ") : undefined;

    titleFixture = titleFixture?.normalize();

    const titleProps =
      titleFixture && titleFixture !== "" ? titleFixture?.split(" ") : undefined;

    mainTitle = mainTitle?.normalize();

    mainTitle = mainTitle === "" ? undefined : mainTitle;

    return { containerProps, title: mainTitle, titleProps };
  }

  /**
   *
   * checks the paragraph node starts with a Text Node;
   * and checks the value starts with container start marker.
   */
  function getOpeningFenceLength(node: Paragraph): number {
    const firstElement = node.children[0];
    if (firstElement.type !== "text") return 0;
    const match = firstElement.value.match(/^:{3,}/u);
    return match ? match[0].length : 0;
  }

  /**
   * {flag: "complete"} means it is complete, so the end marker ":::" is FOUND in the current node; and the current node is MUTATED
   * {flag: "mutated"} means the end marker ":::" is NOT FOUND in the current node; and the current node is MUTATED
   * {flag: "regular"} means it is a regular container starter; and the current node is NOT MUTATED
   */
  type AnalyzeResult = {
    flag: "complete" | "mutated" | "regular";
    type?: string;
    rawtitle?: string;
  };

  /**
   *
   * if the paragraph node has one child (as Text),
   * control whether the node has end marker ":::" or not (check completeness)
   */
  function analyzeChild(node: Paragraph, fenceLen: number): AnalyzeResult {
    const textElement = node.children[0] as Text; // it is guarenteed in "checkTarget"

    let flag: AnalyzeResult["flag"] | undefined = undefined;
    let type: string | undefined = undefined;
  let title: string | undefined = undefined;
  let nIndex: number = -1; // for newline "\n" character

    if (!textElement.value.includes("\n")) {
      // It is regular container, meaningly, there is a blank line before the start marker ":::"
      const match = textElement.value.match(REGEX_START);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [input, triplecolon, _type, _title] = match!;

      flag = "regular";
      type = _type;
      title = _title;
    } else {
      // remove ":::" and whitespaces in the beginning
      const fence = ":".repeat(fenceLen);
      let value = textElement.value
        .replace(new RegExp(`^${fence}`, "u"), "")
        .replace(/^[^\S\r\n]/, ""); // whitespaces not newline

      nIndex = value.indexOf("\n");

      if (nIndex === 0) {
        // means that there is no "type" and "title"

        // remove the newline "\n" in the beginning, and get the rest of the value
        value = value.slice(1);

        // If the very next line starts with another fence (e.g., "::: tip" or just ":::")
        // this is an invalid/misplaced pattern. Keep paragraph as-is (regular), do not mutate.
        const nextLineFenceWithType = new RegExp(`^${fence}\\s*[\\w-]+`, "u");
        const nextLineFenceOnly = new RegExp(`^${fence}\\s*$`, "u");
        if (nextLineFenceWithType.test(value) || nextLineFenceOnly.test(value)) {
          return { flag: "regular", type, rawtitle: title };
        }
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

      if (value.endsWith(":".repeat(fenceLen))) {
        // means that the container starts and ends within same paragraph's Text child

        // remove the closing fence and trim
        const afterClose = value.slice(0, -fenceLen).trim();

        // If there is no type and no title and no content, do not treat as container
        if (!type && !title && afterClose === "") {
          flag = "regular";
        } else {
          textElement.value = afterClose;
          flag = "complete";
        }
      } else {
        // Not closed in the same paragraph. Treat as start (mutated)
        flag = "mutated";
        // mutate the current node to remove the opening fence line
        textElement.value = value;
      }
    }

    return { flag, type, rawtitle: title };
  }

  /**
   *
   * if the paragraph node has more than one child,
   * control whether the node's last child has end marker ":::" or not (check completeness)
   */
  function analyzeChildren(node: Paragraph, fenceLen: number): AnalyzeResult {
    const firstElement = node.children[0] as Text; // it is guarenteed in "checkTarget"

    let flag: AnalyzeResult["flag"] = "mutated"; // it has more children means it can not be "regular"
    let type: string | undefined = undefined;
    let title: string | undefined = undefined;
  let nIndex: number = -1;
    const paragraphChildren: PhrasingContent[] = [];

    if (!firstElement.value.includes("\n")) {
      // means there is a Phrase other than Text Phrase after the line which has opening marker ":::"
      const match = firstElement.value.match(REGEX_START);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [input, triplecolon, _type, _title] = match!;

      type = _type;
      title = _title;
    } else {
      // remove ":::" and whitespaces in the beginning
      const fence = ":".repeat(fenceLen);
      let value = firstElement.value
        .replace(new RegExp(`^${fence}`, "u"), "")
        .replace(/^[^\S\r\n]/, ""); // whitespaces not newline

      nIndex = value.indexOf("\n");

      if (nIndex === 0) {
        // means that there is no "type" and "title"

        // remove the newline "\n" in the beginning, and get the rest of the value
        value = value.slice(1);
      } else {
        // means that there is a "type" and/or a "title"

        // get the type and the title
        const params = value.substring(0, nIndex);
        const match = params.match(/([\w-]+)\s*(.*[^\n ])?/u); // two matching groups: the first word and the rest

        type = match![1];
        title = match![2];

        // remove upto newline "\n" in the beginning, get the rest of the value
        value = value.slice(nIndex + 1);
      }

      // mutate the first element value after extracting type and title
      firstElement.value = value;

      paragraphChildren.push(firstElement);
    }

    // push the Phrases after first Phrase up to last Phrase
    for (let i = 1; i < node.children.length - 1; i++) {
      paragraphChildren.push(node.children[i]);
    }

    const lastElement = node.children[node.children.length - 1];

    // control weather has closing marker or not (check completeness)
    if (lastElement.type === "text") {
      if (lastElement.value.endsWith("\n" + ":".repeat(fenceLen))) {
        flag = "complete";

        // mutate the last Phrase
        lastElement.value = lastElement.value.slice(0, -(fenceLen + 1));
      }

      paragraphChildren.push(lastElement);
    } else if (lastElement) {
      paragraphChildren.push(lastElement);
    }

    // mutate the current paragraph children
    node.children = paragraphChildren;

    return { flag, type, rawtitle: title };
  }

  /**
   *
   * if the paragraph has one child (as Text),
   * control weather has closing wither ":::" or not (check completeness)
   *
   */
  function analyzeClosingNode(node: Paragraph, fenceLen: number): AnalyzeResult["flag"] {
    const { children } = node;

    const lastChild = children[children.length - 1];

    if (lastChild.type === "text") {
      const fence = ":".repeat(fenceLen);
      if (children.length === 1 && lastChild.value.trim() === fence) {
        return "regular";
      }

      // remove closing fence if exists at the end (allow trailing spaces)
  const closeWithNewline = new RegExp(`\\n\\s*${fence}\\s*$`, "u");
  const closeDirect = new RegExp(`${fence}\\s*$`, "u");
      if (closeWithNewline.test(lastChild.value)) {
        lastChild.value = lastChild.value.replace(closeWithNewline, "");
      } else if (closeDirect.test(lastChild.value)) {
        lastChild.value = lastChild.value.replace(closeDirect, "");
      }

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

  /**
   *
   * if the paragraph has one child,
   * control wether it has only one child text, and the text value is empty string ""
   *
   */
  function checkParagraphWithEmptyText(node: Paragraph): boolean {
    if (
      node.children.length === 1 &&
      node.children[0].type === "text" &&
      node.children[0].value === ""
    ) {
      return true;
    }

    return false;
  }

  /**
   *
   * if the first child of paragraph children is "break", then remove that child
   *
   */
  function deleteFirstChildBreak(node: Paragraph): undefined {
    if (node.children[0].type === "break") {
      node.children.shift();
    }
  }

  /**
   *
   * type predicate function
   */
  function is<T extends Node>(node: Node, type: string): node is T {
    return node.type === type;
  }

  const transformer: Transformer<Root> = (tree) => {
    // Do not pre-split paragraphs; handle opening/closing within the analyzer
    // to preserve expected behavior for invalid patterns.

    // Targeted split: if a paragraph starts with a fence and contains a pure closing
    // fence line later followed by more content, split into two paragraphs at that line.
    visit(tree, "paragraph", function (node, index, parent) {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;
      if (node.children.length !== 1 || node.children[0].type !== "text") return;

      const text = (node.children[0] as Text).value;
      const open = text.match(/^(:{3,})/u);
      if (!open) return;
      if (!text.includes("\n")) return;

      const fence = open[1];
      const lines = text.split(/\n/);
      // Find a line that equals the same-length fence (allow surrounding spaces) and has content after it
      let closeIdx = -1;
      for (let i = 1; i < lines.length; i++) {
        if (new RegExp(`^\\s*${fence}\\s*$`, "u").test(lines[i])) {
          closeIdx = i;
          break;
        }
      }
      if (closeIdx === -1) return;
      if (closeIdx >= lines.length - 1) return; // nothing after closing -> don't split

      const firstPart = lines.slice(0, closeIdx + 1).join("\n");
      const secondPart = lines.slice(closeIdx + 1).join("\n");

      const p1 = u("paragraph", [u("text", firstPart)]) as Paragraph;
      const p2 = u("paragraph", [u("text", secondPart)]) as Paragraph;
      parent.children.splice(index, 1, p1, p2);
      return index + 2;
    });

    // if a html node.value ends with a closing fence, remove and carry it into a new paragraph
    visit(tree, "html", function (node, index, parent) {
      /* v8 ignore next */
      if (!parent || typeof index === "undefined") return;

      const m = node.value.match(/\n(:{3,})\s*$/u);
      if (!m) return;

      node.value = node.value.replace(/\n(:{3,})\s*$/u, "");

      const p = u("paragraph", [u("text", "\n" + m[1])]);

      // add the paragraph after the html node, in order to the next visitor can catch the container node
      parent.children.splice(index + 1, 0, p);
    });

    // multi-pass visit to allow nested containers
    for (let pass = 0; pass < 10; pass++) {
      let changes = 0;

      visit(tree, "paragraph", function (node, index, parent) {
        /* v8 ignore next */
        if (!parent || typeof index === "undefined") return;

        const fenceLen = getOpeningFenceLength(node);
        if (!fenceLen) return;

        const { flag, type, rawtitle } =
          node.children.length === 1
            ? analyzeChild(node, fenceLen) // mutates the node
            : analyzeChildren(node, fenceLen); // mutates the node

        const { containerProps, title, titleProps } = getSpecificIdentifiers(rawtitle?.trim());

        if (flag === "complete") {
          const titleNode = constructTitle(type, title, titleProps);

          deleteFirstChildBreak(node); // mutates the node

          const isParagraphWithEmptyText = checkParagraphWithEmptyText(node);

          const containerChildren = isParagraphWithEmptyText
            ? [...(titleNode ? [titleNode] : [])]
            : [...(titleNode ? [titleNode] : []), node];

          const containerNode = constructContainer(
            containerChildren,
            type,
            title,
            containerProps,
          );

          parent.children.splice(index, 1, containerNode);
          changes++;

          return CONTINUE;
        }

        const openingNode = node;
        const openingFlag = flag;

        const closingNode = findAfter(parent, openingNode, function (node) {
          if (node.type !== "paragraph") return false;

          const pChildren = (node as Paragraph).children;
          const lastChild = pChildren[pChildren.length - 1];

          if (lastChild.type !== "text") return false;

          const fence = ":".repeat(fenceLen);
          const re = new RegExp(`${fence}\\s*$`, "u");
          return re.test(lastChild.value);
        });

        if (!closingNode) return;

        // just for type prediction
        /* v8 ignore next */
        if (!is<Paragraph>(closingNode, "paragraph")) return;

        const closingFlag = analyzeClosingNode(closingNode, fenceLen); // mutates the closingNode

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

        // If there is no type, no title and no content between fences, treat as regular text
        if (!type && !title && containerChildren.length === 0) {
          return CONTINUE;
        }

        const titleNode = constructTitle(type, title, titleProps);

        if (titleNode) containerChildren.splice(0, 0, titleNode);

        const containerNode = constructContainer(
          containerChildren,
          type,
          title,
          containerProps,
        );

        const { children } = parent;
        const openingIndex = children.indexOf(openingNode);
        const closingIndex = children.indexOf(closingNode);
        children.splice(openingIndex, closingIndex - openingIndex + 1, containerNode);
        changes++;

        return CONTINUE;
      });

      if (changes === 0) break;
    }
  };

  return transformer;
};

export default plugin;
