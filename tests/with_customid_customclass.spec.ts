import dedent from "dedent";

import { process } from "./util/index";

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
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section class="remark-container info myclass" id="foo"><span class="remark-container-title info someclass" id="baz">Title Of Information</span><p>content</p></section>"`,
    );
  });

  // ******************************************
  it("example in the demo app", async () => {
    const input = dedent`
      ::: details {details.remark-details} Title Of Information {summary.remark-summary}
      content
      :::
    `;

    // if there is specific identifiers for the title, should break the rule "title: () => null"

    expect(await process(input, { title: () => null })).toMatchInlineSnapshot(
      `"<details class="remark-container details remark-details"><summary class="remark-container-title details remark-summary">Title Of Information</summary><p>content</p></details>"`,
    );
  });
});
