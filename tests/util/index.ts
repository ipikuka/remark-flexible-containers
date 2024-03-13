import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { Root } from "mdast";
import type { VFileCompatible, Value } from "vfile";

import plugin, { FlexibleContainerOptions } from "../../src";

const compilerCreator = (options?: FlexibleContainerOptions) =>
  unified()
    .use(remarkParse)
    .use(gfm)
    .use(plugin, options)
    .use(remarkRehype)
    .use(rehypeStringify);

export const process = async (
  content: VFileCompatible,
  options?: FlexibleContainerOptions,
): Promise<Value> => {
  const vFile = await compilerCreator(options).process(content);

  return vFile.value;
};

/**
 *
 * log mdast tree to console.dir as a plugin
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pluginLogTree() {
  return (tree: Root) => {
    console.dir(
      JSON.parse(
        JSON.stringify(
          tree,
          function replacer(key, value) {
            if (key === "position") return undefined;
            else return value;
          },
          2,
        ),
      ),
      { depth: null },
    );
  };
}
