import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { type FlexibleContainerOptions } from "../src/index.js";
import { process } from "./util/index.js";

const options: FlexibleContainerOptions = {
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
    return type === "details" ? ["remark-summary"] : ["remark-container-title", type ?? ""];
  },
  title(type?: string, title?: string) {
    return type === "details" ? (title ?? "Details") : (title ?? type);
  },
};

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

    expect(await process(input, options)).toMatchInlineSnapshot(`
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

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<details class="remark-details"><summary class="remark-summary">Title</summary><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></details>"`,
    );
  });
});
