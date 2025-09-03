import { describe, it, expect } from "vitest";
import dedent from "dedent";
import * as prettier from "prettier";

import { process } from "./util/index";

describe("special/custom props", () => {
  // ******************************************
  it("handles no effect for special characters but no names", async () => {
    const input = dedent`
      :::tip {. # @} Title { . # @}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<div class="remark-container tip"><div class="remark-container-title tip">Title</div><p>content</p></div>"`);
  });

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
      `"<div id="foo" class="remark-container tip"><div id="bar" class="remark-container-title tip">Title</div><p>content</p></div>"`,
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
  it("with special classname, no title", async () => {
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
  it("multiple class names vs multiple id", async () => {
    const input = dedent`
      ::: info {section#foo.myclass.yourclass#id} Title Of Information {span#baz.someclass.anotherclass#id}
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section id="foo" class="remark-container info myclass yourclass"><span id="baz" class="remark-container-title info someclass anotherclass">Title Of Information</span><p>content</p></section>"`,
    );
  });

  // ******************************************
  it("example in the demo app", async () => {
    const input = dedent`
      ::: info {details.remark-details} Title Of Information {summary.remark-summary}
      content
      :::
    `;

    // if there is specific identifiers for the title, should break the rule "title: () => null", except details

    const output = await process(input, { title: () => null });
    const formatted_output = await prettier.format(String(output), { parser: "mdx" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<details class="remark-container info remark-details">
        <summary class="remark-container-title info remark-summary">
          Title Of Information
        </summary>
        <p>content</p>
      </details>
      "
    `);
  });

  // ******************************************
  it("supports attributes", async () => {
    const input = dedent`
      ::: details {@open} Title
      content
      :::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "mdx" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<details class="remark-details" open>
        <summary class="remark-summary">Title</summary>
        <p>content</p>
      </details>
      "
    `);
  });

  // ******************************************
  it("supports multiple attributes", async () => {
    // putting a space before @open is necerray here otherwise remark-gfm interpret is autolink
    const input = dedent`
      ::: info {section.myclass @open.someclass} Title {span@disabled#id@data-type=expandable}
      content
      :::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "mdx" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<section class="remark-container info myclass someclass" open>
        <span
          id="id"
          class="remark-container-title info"
          disabled
          data-type="expandable"
        >
          Title
        </span>
        <p>content</p>
      </section>
      "
    `);
  });
});
