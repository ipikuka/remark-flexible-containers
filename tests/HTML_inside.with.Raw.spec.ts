import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import dedent from "dedent";
import type { VFileCompatible } from "vfile";

import plugin from "../src";

const compiler = unified()
  .use(remarkParse)
  .use(gfm)
  .use(plugin)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("no options - with HTML elements", () => {
  // ******************************************
  it("handles normally when no html 1", async () => {
    const input = dedent`
      ::: warning 
      Hi **JSX** in \`mdx\`.
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container warning"><p>Hi <strong>JSX</strong> in <code>mdx</code>.</p></div>"`,
    );
  });

  // ******************************************
  it("handles normally when no html 2", async () => {
    const input = dedent`
      :::tip Tips
      #### Table of Contents
      Abbreviation is the \`TOC\`.
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container tip"><div class="remark-container-title tip">Tips</div><h4>Table of Contents</h4><p>Abbreviation is the <code>TOC</code>.</p></div>"`,
    );
  });

  // ******************************************
  it("handles markdown in inline-level html elements, and html tag stays", async () => {
    const input = dedent`
      ::: danger Title
      <span>This **is** always \`xxx\`.</span>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><span>This <strong>is</strong> always <code>xxx</code>.</span></p></div>"`,
    );
  });

  // ******************************************
  it("handles block-level html elements, but the markdown inside is not rendered 1", async () => {
    const input = dedent`
      ::: danger Title
      <p>This **is** always \`xxx\`.</p>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p>This **is** always \`xxx\`.</p></div>"`,
    );
  });

  // ******************************************
  it("handles block-level html elements, but the markdown inside is not rendered 2", async () => {
    const input = dedent`
      ::: danger Title
      <details>
        <summary>**Heading of Summary**</summary>
        + listitem - \`1\`,
        + listitem - \`2\`,
        <p>_What do you think?_</p>
      </details>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<div class="remark-container danger"><div class="remark-container-title danger">Title</div><details>
        <summary>**Heading of Summary**</summary>
        + listitem - \`1\`,
        + listitem - \`2\`,
        <p>_What do you think?_</p>
      </details></div>"
    `);
  });

  // ******************************************
  it("complex", async () => {
    const input = dedent`
      ::: danger   My   Title
      ::it does not confuse with double colons::
      <mark>marked text</mark>

      <MarkRed>tag names is **lowercased** by \`parse5\`</MarkRed>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p>::it does not confuse with double colons::
      <mark>marked text</mark></p><p><markred>tag names is <strong>lowercased</strong> by <code>parse5</code></markred></p></div>"
    `);
  });
});
