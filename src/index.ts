import { visit, CONTINUE, type Visitor, type VisitorResult } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Node, Parent } from "unist";
import { u } from "unist-builder";
import type { Paragraph, PhrasingContent, Root, Text } from "mdast";
import { findAfter } from "unist-util-find-after";
import { findAllBetween } from "unist-util-find-between-all";

type TagNameFunction = (type?: string, title?: string) => string;
type ClassNameFunction = (type?: string, title?: string) => string[];
type PropertyFunction = (type?: string, title?: string) => Record<string, unknown>;
type TitleFunction = (type?: string, title?: string) => string | null | undefined;

export type FlexibleContainerOptions = {
  containerTagName?: string | TagNameFunction;
  containerClassName?: string | ClassNameFunction;
  containerProperties?: PropertyFunction;
  title?: TitleFunction;
  titleTagName?: string | TagNameFunction;
  titleClassName?: string | ClassNameFunction;
  titleProperties?: PropertyFunction;
};

const DEFAULT_SETTINGS: FlexibleContainerOptions = {
  containerTagName: "div",
  containerClassName: "remark-container",
  containerProperties: undefined,
  title: undefined,
  titleTagName: "div",
  titleClassName: "remark-container-title",
  titleProperties: undefined,
};

export const REGEX_START = /^(:{3})\s*(\w+)?\s*(.*[^ \n])?/u;
export const REGEX_END = /\s*\n*?:::$/;
export const REGEX_BAD_SYNTAX = /^:::\s*\n+\s*:::\s*.*/;

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
  const settings = Object.assign({}, DEFAULT_SETTINGS, options);

  const constructTitle = (type?: string, title?: string): Paragraph | undefined => {
    const _type = type?.toLowerCase();
    const _title = title?.replace(/\s+/g, " ");

    const _settingsTitle = settings.title?.(_type, _title);
    const _mainTitle = _title;

    if (_settingsTitle === null || (_settingsTitle === undefined && !_mainTitle)) return;

    let properties: Record<string, unknown> | undefined;

    if (settings.titleProperties) {
      properties = settings.titleProperties(_type, _title);

      Object.entries(properties).forEach(([k, v]) => {
        if ((typeof v === "string" && v === "") || (Array.isArray(v) && v.length === 0)) {
          properties && (properties[k] = undefined);
        }
      });
    }

    const titleTagName =
      typeof settings.titleTagName === "string"
        ? settings.titleTagName
        : settings.titleTagName?.(_type, _title);

    const titleClassName =
      typeof settings.titleClassName === "string"
        ? [settings.titleClassName!, _type ?? ""]
        : [...(settings.titleClassName?.(_type, _title) ?? [])];

    return {
      type: "paragraph",
      children: [{ type: "text", value: _settingsTitle || _mainTitle || "" }],
      data: {
        hName: titleTagName,
        hProperties: {
          className: titleClassName,
          ...(properties && { ...properties }),
        },
      },
    };
  };

  const constructContainer = (children: Node[], type?: string, title?: string): Parent => {
    const _type = type?.toLowerCase();
    const _title = title?.replace(/\s+/g, " ");

    let properties: Record<string, unknown> | undefined;

    if (settings.containerProperties) {
      properties = settings.containerProperties(_type, _title);

      Object.entries(properties).forEach(([k, v]) => {
        if ((typeof v === "string" && v === "") || (Array.isArray(v) && v.length === 0)) {
          properties && (properties[k] = undefined);
        }
      });
    }

    const containerTagName =
      typeof settings.containerTagName === "string"
        ? settings.containerTagName
        : settings.containerTagName?.(_type, _title);

    const containerClassName =
      typeof settings.containerClassName === "string"
        ? [settings.containerClassName!, _type ?? ""]
        : [...(settings.containerClassName?.(_type, _title) ?? [])];

    return {
      type: "container",
      children,
      data: {
        hName: containerTagName,
        hProperties: {
          className: containerClassName,
          ...(properties && { ...properties }),
        },
      },
    };
  };

  /**
   *
   * It checks the paragraph node starts with a Text Node.
   * And checks the value starts with container start marker.
   */
  function checkIsTarget(node: Paragraph): boolean {
    const firstElement = node.children[0];

    if (firstElement.type !== "text") return false;

    if (REGEX_BAD_SYNTAX.test(firstElement.value)) {
      return false;
    }

    return firstElement.value.startsWith(":::");
  }

  /**
   * {flag: "complete"} means it is complete, so the end marker ":::" is FOUND in the current node; and the current node is MUTATED
   * {flag: "mutated"} means the end marker ":::" is NOT FOUND in the current node; and the current node is MUTATED
   * {flag: "regular"} means it is a regular container starter; and the current node is NOT MUTATED
   */
  type AnalyzeResult = {
    flag: "complete" | "mutated" | "regular";
    type?: string;
    title?: string;
  };

  /**
   *
   * if the paragraph node has one child (as Text),
   * control whether the node has end marker ":::" or not (check completeness)
   */
  function analyzeChild(node: Paragraph): AnalyzeResult {
    const textElement = node.children[0] as Text; // it is guarenteed in "checkTarget"

    let flag: AnalyzeResult["flag"] | undefined = undefined;
    let type: string | undefined = undefined;
    let title: string | undefined = undefined;
    let nIndex: number | undefined = undefined; // for newline "\n" character

    if (!textElement.value.includes("\n")) {
      // It is regular container, meaningly, there is a blank line after the start marker ":::"
      const match = textElement.value.match(REGEX_START);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [input, triplecolon, _type, _title] = match!;

      flag = "regular";
      type = _type;
      title = _title;
    } else {
      // remove ":::" and whitespaces in the beginning
      let value = textElement.value.replace(/^:::/, "").replace(/^[^\S\r\n]/, ""); // whitespaces not newline

      nIndex = value.indexOf("\n");

      if (nIndex === 0) {
        // means that there is no "type" and "title"

        // remove the newline "\n" in the beginning, and get the rest of the value
        value = value.slice(1);
      } else {
        // means that there is a "type" and/or a "title"

        // get the type and the title
        const params = value.substring(0, nIndex);
        const match = params.match(/(\w+)\s*(.*[^\n ])?/u); // two matching groups: the first word and the rest

        type = match![1];
        title = match![2];

        // remove upto newline "\n" (included) in the beginning, get the rest of the value
        value = value.slice(nIndex + 1); // extraxted \n from the beginning
      }

      if (value.endsWith(":::")) {
        // means that the container starts and ends within same paragraph's Text child

        // remove the "\n:::" at the end
        value = value.slice(0, -3).trim();

        flag = "complete";
      } else {
        flag = "mutated";
      }

      // mutate the current node
      textElement.value = value;
    }

    return { flag, type, title };
  }

  /**
   *
   * if the paragraph node has more than one child,
   * control whether the node's last child has end marker ":::" or not (check completeness)
   */
  function analyzeChildren(node: Paragraph): AnalyzeResult {
    const firstElement = node.children[0] as Text; // it is guarenteed in "checkTarget"

    let flag: AnalyzeResult["flag"] = "mutated"; // it has more children means it can not be "regular"
    let type: string | undefined = undefined;
    let title: string | undefined = undefined;
    let nIndex: number | undefined = undefined;
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
      let value = firstElement.value.replace(/^:::/, "").replace(/^[^\S\r\n]/, ""); // whitespaces not newline

      nIndex = value.indexOf("\n");

      if (nIndex === 0) {
        // means that there is no "type" and "title"

        // remove the newline "\n" in the beginning, and get the rest of the value
        value = value.slice(1);
      } else {
        // means that there is a "type" and/or a "title"

        // get the type and the title
        const params = value.substring(0, nIndex);
        const match = params.match(/(\w+)\s*(.*[^\n ])?/u); // two matching groups: the first word and the rest

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
      if (lastElement.value.endsWith("\n:::")) {
        flag = "complete";

        // mutate the last Phrase
        lastElement.value = lastElement.value.slice(0, -4);
      }

      paragraphChildren.push(lastElement);
    } else if (lastElement) {
      paragraphChildren.push(lastElement);
    }

    // mutate the current paragraph children
    node.children = paragraphChildren;

    return { flag, type, title };
  }

  /**
   *
   * if the paragraph has one child (as Text),
   * control weather has closing wither ":::" or not (check completeness)
   *
   */
  function analyzeClosingNode(node: Paragraph): AnalyzeResult["flag"] {
    const { children } = node;

    const lastChild = children[children.length - 1];

    if (lastChild.type === "text") {
      if (children.length === 1 && lastChild.value === ":::") {
        return "regular";
      }

      lastChild.value = lastChild.value.replace(REGEX_END, "");

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
    if (node.children.length === 0) return true;

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
    if (node.children.length === 0) return;

    if (node.children[0].type === "break") {
      node.children.shift();
    }
  }

  const visitor: Visitor<Paragraph> = function (node, index, parent): VisitorResult {
    if (!parent) return;

    const isTarget = checkIsTarget(node);

    if (!isTarget) return;

    let openingFlag: AnalyzeResult["flag"] | undefined = undefined;
    let type: string | undefined = undefined;
    let title: string | undefined = undefined;

    if (node.children.length === 1) {
      const { flag: _flag, type: _type, title: _title } = analyzeChild(node); // mutates the node

      openingFlag = _flag;
      type = _type;
      title = _title;
    }

    if (node.children.length > 1) {
      const { flag: _flag, type: _type, title: _title } = analyzeChildren(node); // mutates the node

      openingFlag = _flag;
      type = _type;
      title = _title;
    }

    if (openingFlag === "complete") {
      // means that the container starts and ends within the same paragraph node

      const titleNode = constructTitle(type, title);

      deleteFirstChildBreak(node); // mutates the node

      const isParagraphWithEmptyText = checkParagraphWithEmptyText(node);

      // is the paragraph node has only one child with empty text, don't add that paragraph node as a child
      // meaningly, don't produce empty <p />
      const containerChildren = isParagraphWithEmptyText
        ? [...(titleNode ? [titleNode] : [])]
        : [...(titleNode ? [titleNode] : []), node];

      const containerNode = constructContainer(containerChildren, type, title);

      // place it the place of the current paragraph node
      parent.children.splice(index!, 1, containerNode);

      return CONTINUE;
    }

    const openingNode = node;

    const closingNode = findAfter(parent, openingNode, function (node) {
      const pChildren = (node as Paragraph).children;

      return (
        node.type === "paragraph" &&
        Boolean((pChildren[pChildren.length - 1] as Text).value?.match(REGEX_END))
      );
    });

    if (!closingNode) return;

    const closingFlag = analyzeClosingNode(closingNode as Paragraph);

    const containerChildren = findAllBetween(parent, openingNode, closingNode);

    if (openingFlag === "mutated") {
      containerChildren.unshift(openingNode);
    }

    if (closingFlag === "mutated") {
      containerChildren.push(closingNode);
    }

    // if there is no content and type do not construct the container

    if (!containerChildren.length && !type) return;

    // if there is no content but type, then continue to construct the container

    const titleNode = constructTitle(type, title);

    if (titleNode) containerChildren.splice(0, 0, titleNode);

    const containerNode = constructContainer(containerChildren, type, title);

    const { children } = parent;
    const openingIndex = children.indexOf(openingNode);
    const closingIndex = children.indexOf(closingNode);
    children.splice(openingIndex, closingIndex - openingIndex + 1, containerNode);
  };

  const transformer: Transformer<Root> = (tree) => {
    // if there is a html node with the value at the end "\n:::"
    // then move the "\n:::" part into a new paragraph
    visit(tree, "html", (node, index, parent) => {
      if (!/\n:::$/.test(node.value)) return;

      node.value = node.value.replace(/\n:::$/, "");

      const p = u("paragraph", [u("text", "\n:::")]);

      // add the paragraph after the html node, in order to the next visitor can catch the container node
      parent?.children.splice(index! + 1, 0, p);
    });

    /************************************/

    // main function
    visit(tree, "paragraph", visitor);
  };

  return transformer;
};

export default plugin;
