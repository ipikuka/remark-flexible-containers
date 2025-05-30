import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { process } from "./util/index";

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
  it("handles markdown in inline-level html elements, but html tag is stripped out", async () => {
    const input = dedent`
      ::: danger Title
      <span>This **is** always \`xxx\`.</span>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p>This <strong>is</strong> always <code>xxx</code>.</p></div>"`,
    );
  });

  // ******************************************
  it("does not handle block-level html elements, which is stripped out completely 1", async () => {
    const input = dedent`
      ::: danger Title
      <p>This **is** always \`xxx\`.</p>
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div></div>"`,
    );
  });

  // ******************************************
  it("does not handle block-level html elements, which is stripped out completely 2", async () => {
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

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div></div>"`,
    );
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
      marked text</p><p>tag names is <strong>lowercased</strong> by <code>parse5</code></p></div>"
    `);
  });
});

// HTML elements disappear, since we didn't use `rehype-raw`

// https://github.com/rehypejs/rehype-raw/issues/16#issuecomment-591901361
// If you want to enter markdown after block-level HTML again, you need that blank line.
// Without it, markdown parser sees it as one block of HTML.
