import { visit, type Visitor } from "unist-util-visit";
import type { Plugin, Transformer } from "unified";
import type { Node, Parent, Data } from "unist";
import type { Paragraph, Root, Text } from "mdast";
import { findAfter } from "unist-util-find-after";
import between from "unist-util-find-all-between";

type TPropertyFunction = (type?: string, title?: string) => Record<string, unknown>;

export type FlexibleContainerOptions = {
  containerTagName?: string;
  containerClassName?: string;
  containerProperties?: TPropertyFunction;
  title?: null;
  titleTagName?: string;
  titleClassName?: string;
  titleProperties?: TPropertyFunction;
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

export const REGEX_START = /^(:{3})\s*(\w+)?\s*(.*[^ ])?/;
export const REGEX_END = /^:::$/;

/**
 *
 * This plugin adds a container with customizable properties iot produce callout or admonition
 *
 * for example:
 *
 * ::: warning My Title
 *
 * my paragraph with **bold**
 *
 * :::
 *
 */
export const plugin: Plugin<[FlexibleContainerOptions?], Root> = (options) => {
  const settings = Object.assign({}, DEFAULT_SETTINGS, options);

  const constructTitle = (type: string, title: string): Paragraph => {
    let properties: Record<string, unknown> | undefined;

    if (settings.titleProperties) {
      properties = settings.titleProperties(type.toLowerCase(), title.replace(/\s+/g, " "));

      Object.entries(properties).forEach(([k, v]) => {
        if (typeof v === "string" && !v.length) {
          properties && (properties[k] = undefined);
        }
      });
    }

    return {
      type: "paragraph",
      children: [{ type: "text", value: title.replace(/\s+/g, " ") }],
      data: {
        hName: settings.titleTagName,
        hProperties: {
          className: [settings.titleClassName, type.toLowerCase()],
          ...(properties && { ...properties }),
        },
      },
    };
  };

  const constructContainer = (children: Node<Data>[], type: string, title: string): Parent => {
    let properties: Record<string, unknown> | undefined;

    if (settings.containerProperties) {
      properties = settings.containerProperties(type.toLowerCase(), title.replace(/\s+/g, " "));

      Object.entries(properties).forEach(([k, v]) => {
        if (typeof v === "string" && !v.length) {
          properties && (properties[k] = undefined);
        }
      });
    }

    return {
      type: "container",
      children,
      data: {
        hName: settings.containerTagName,
        hProperties: {
          className: [settings.containerClassName, type.toLowerCase()],
          ...(properties && { ...properties }),
        },
      },
    };
  };

  const matchParagraph = (node: Paragraph): null | [string, string] => {
    const firstElement = node.children[0];

    if (firstElement.type !== "text") return null;

    const match = firstElement.value.match(REGEX_START);

    if (!match) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [input, triplecolon, type, title] = match;

    return [type, title];
  };

  const visitor: Visitor<Paragraph> = function (node, _, parent) {
    if (!parent) return;

    const match = matchParagraph(node);

    if (!match) return;

    const [type, title] = match;
    const { children } = parent;

    const openingNode = node;

    const closingNode = findAfter(parent, openingNode, function (node) {
      return (
        node.type === "paragraph" &&
        Boolean(((node as Paragraph).children[0] as Text).value?.match(REGEX_END))
      );
    });

    if (!closingNode) return;

    const containerChildren = between(parent, openingNode, closingNode);

    if (!containerChildren.length && !type) return;

    if (settings.title !== null && title) {
      const titleNode = constructTitle(type ?? "", title ?? "");

      if (titleNode) containerChildren.splice(0, 0, titleNode);
    }

    const containerNode = constructContainer(containerChildren, type ?? "", title ?? "");

    const openingIndex = children.indexOf(openingNode);
    const closingIndex = children.indexOf(closingNode);
    parent.children.splice(openingIndex, closingIndex - openingIndex + 1, containerNode);
  };

  const transformer: Transformer<Root> = (tree) => {
    visit(tree, "paragraph", visitor);
  };

  return transformer;
};

export default plugin;
