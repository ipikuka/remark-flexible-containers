import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { process } from "./util/index";

describe("with options - details summary", () => {
  // ******************************************
  it("produces details summary", async () => {
    const input = dedent`
      ::: details
      content
      :::

      ::: details Title
      content
      :::

      ::: warning Title
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<details class="remark-details"><summary class="remark-summary">Details</summary><p>content</p></details>
      <details class="remark-details"><summary class="remark-summary">Title</summary><p>content</p></details>
      <div class="remark-container warning"><div class="remark-container-title warning">Title</div><p>content</p></div>"
    `);
  });

  // ******************************************
  it("produces details summary, more content", async () => {
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

  // ******************************************
  it("if option title is null, it doesn't affect details title", async () => {
    const input = dedent`
      ::: details
      content
      :::

      ::: details Title
      content
      :::
    `;

    expect(await process(input, { title: () => null })).toMatchInlineSnapshot(`
      "<details class="remark-details"><summary class="remark-summary">Details</summary><p>content</p></details>
      <details class="remark-details"><summary class="remark-summary">Title</summary><p>content</p></details>"
    `);
  });
});
