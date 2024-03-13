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
  .use(plugin)
  .use(remarkRehype)
  .use(rehypeStringify);

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("special/custom props", () => {
  // ******************************************
  it("with special tag name", async () => {
    const input = dedent`
      :::tip {details} Title {summary}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<details class="remark-container tip"><summary class="remark-container-title tip">Title</summary><p>content</p></details>"`,
    );
  });

  // ******************************************
  it("with special id no", async () => {
    const input = dedent`
      :::tip {#foo} Title {#bar}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container tip" id="foo"><div class="remark-container-title tip" id="bar">Title</div><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("with special classname", async () => {
    const input = dedent`
      :::tip {.foo} Title {.bar}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container tip foo"><div class="remark-container-title tip bar">Title</div><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("with special classname", async () => {
    const input = dedent`
      :::tip {.foo} {.bar}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container tip foo"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("example in the readme", async () => {
    const input = dedent`
      ::: info {section#foo.myclass} Title Of Information {span#baz.someclass}
      <!-- content -->
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section class="remark-container info myclass" id="foo"><span class="remark-container-title info someclass" id="baz">Title Of Information</span></section>"`,
    );
  });
});
