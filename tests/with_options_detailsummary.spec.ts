import dedent from "dedent";

import { type FlexibleContainerOptions } from "../src";
import { process } from "./util/index";

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
    return type === "details" ? ["remark-summary"] : ["remark-container-title"];
  },
};

describe("with options - success", () => {
  // ******************************************
  it("No type, no title, with content", async () => {
    const input = dedent`
      ::: warning Title
      content
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
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

    expect(await process(input, options)).toMatchInlineSnapshot(
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

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<details class="remark-details"><summary class="remark-summary">Title</summary><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></details>"`,
    );
  });
});
