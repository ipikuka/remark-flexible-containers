import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import dedent from "dedent";
import type { VFileCompatible } from "vfile";

import plugin from "../src";

const compiler = unified()
  .use(remarkParse)
  .use(gfm)
  .use(plugin, {
    containerTagName(type) {
      return type === "details" ? "details" : "div";
    },
    containerClassName(type) {
      return type === "details" ? ["remark-details"] : ["remark-container", type ?? ""];
    },
    titleTagName(type) {
      return type === "details" ? "summary" : "div";
    },
    titleClassName(type) {
      return type === "details" ? ["remark-summary"] : ["remark-container-title"];
    },
  })
  .use(remarkRehype)
  .use(rehypeStringify);

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("with options - success", () => {
  // ******************************************
  it("No type, no title, with content", async () => {
    const input = dedent`
      ::: warning Title
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container warning"><div class="remark-container-title">Title</div><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: details Title
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<details class="remark-details"><summary class="remark-summary">Title</summary><p>content</p></details>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined, more content", async () => {
    const input = dedent`
        ::: details Title
        **bold text** paragraph

        other paragraph *italic content*
        :::
      `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<details class="remark-details"><summary class="remark-summary">Title</summary><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></details>"`,
    );
  });
});
