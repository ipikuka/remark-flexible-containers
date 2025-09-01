import { describe, it, expect } from "vitest";
import dedent from "dedent";
import * as prettier from "prettier";

import { process } from "../tests/util/index";
import type { FlexibleContainerOptions } from "../src";

describe("supports any fence length >=3", () => {
  it("fails if fence length is mismatched in opening and closing", async () => {
    const input = dedent`
      :::: info My Title
      **bold**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p><strong>bold</strong>
      :::</p>"
    `);
  });

  it("supports 4-colon containers", async () => {
    const input = dedent`
      :::: info My Title
      **bold**
      ::::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container info"><div class="remark-container-title info">My Title</div><p><strong>bold</strong></p></div>"`,
    );
  });

  it("supports 5-colon containers", async () => {
    const input = dedent`
      ::::: info My Title
      **bold**
      :::::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container info"><div class="remark-container-title info">My Title</div><p><strong>bold</strong></p></div>"`,
    );
  });
});

describe("nesting with varying fence lengths", () => {
  it("fails nesting if nested fence has more colons", async () => {
    const input = dedent`
      ::: outer Outer

      :::: inner Inner

      ::::: deeper Deeper
      **bold**
      :::::
      
      ::::
      :::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "html" });

    // only outer works, but inners fail
    expect(formatted_output).toMatchInlineSnapshot(`
      "<div class="remark-container outer">
        <div class="remark-container-title outer">Outer</div>
        <p>:::: inner Inner</p>
        <p><strong>bold</strong> ::</p>
      </div>
      <p>:::</p>
      "
    `);
  });

  it("supports deeper containers", async () => {
    const input = dedent`
      ::::: outer Outer

      :::: inner Inner

      ::: deeper Deeper
      **bold**
      :::
      
      ::::
      :::::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "html" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<div class="remark-container outer">
        <div class="remark-container-title outer">Outer</div>
        <div class="remark-container inner">
          <div class="remark-container-title inner">Inner</div>
          <div class="remark-container deeper">
            <div class="remark-container-title deeper">Deeper</div>
            <p><strong>bold</strong></p>
          </div>
        </div>
      </div>
      "
    `);
  });

  it("supports an outer 4-colon container with inner 3-colon containers", async () => {
    const input = dedent`
      :::: tab-group Tab Group
      
      ::: tab First Tab
      **bold**
      :::
      
      ::: tab Second Tab
      **bold**
      :::
      
      ::::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "html" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<div class="remark-container tab-group">
        <div class="remark-container-title tab-group">Tab Group</div>
        <div class="remark-container tab">
          <div class="remark-container-title tab">First Tab</div>
          <p><strong>bold</strong></p>
        </div>
        <div class="remark-container tab">
          <div class="remark-container-title tab">Second Tab</div>
          <p><strong>bold</strong></p>
        </div>
      </div>
      "
    `);
  });

  it("supports an outer 4-colon container with inner 3-colon containers, with options", async () => {
    const input = dedent`
      :::: tab-group Tab Group
      
      ::: tab First Tab
      :::
      
      ::: tab Second Tab
      :::
      
      ::::
    `;

    const options: FlexibleContainerOptions = {
      containerTagName(type) {
        if (type === "tab-group") return "TabGroup";
        if (type === "tab") return "Tab";
        return "div";
      },
      containerClassName(type) {
        if (type === "tab-group") return ["tab-group"];
        if (type === "tab") return ["tab"];
        return ["remark-container", type ?? ""];
      },
      containerProperties(type, title) {
        if (type === "tab-group") return { role: "tablist" };
        if (type === "tab") return { role: "tab", "data-title": title };
        return {};
      },
      titleTagName(type) {
        if (type === "tab-group") return "TabGroupTitle";
        if (type === "tab") return "TabTitle";
        return "div";
      },
      titleClassName(type) {
        if (type === "tab-group") return ["tab-group-title"];
        if (type === "tab") return ["tab-title"];
        return ["remark-container-title"];
      },
    };

    const output = await process(input, options);
    const formatted_output = await prettier.format(String(output), { parser: "mdx" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<TabGroup class="tab-group" role="tablist">
        <TabGroupTitle class="tab-group-title">Tab Group</TabGroupTitle>
        <Tab class="tab" role="tab" data-title="First Tab">
          <TabTitle class="tab-title">First Tab</TabTitle>
        </Tab>
        <Tab class="tab" role="tab" data-title="Second Tab">
          <TabTitle class="tab-title">Second Tab</TabTitle>
        </Tab>
      </TabGroup>
      "
    `);
  });

  it("supports an outer 4-colon container with inner 3-colon containers, with custom specifiers", async () => {
    const input = dedent`
      :::: tab-group {TabGroup#my-tab-group} Tab Group Title {TabGroupTitle#tab-group-title}
      
      ::: tab {Tab.active#first-tab} First Tab Title {TabTitle#first-tab-title}
      First Tab Content
      :::
      
      ::: tab {Tab#second-tab} Second Tab Title {TabTitle#second-tab-title}
      Second Tab Content
      :::
      
      ::::
    `;

    const output = await process(input);
    const formatted_output = await prettier.format(String(output), { parser: "mdx" });

    expect(formatted_output).toMatchInlineSnapshot(`
      "<TabGroup id="my-tab-group" class="remark-container tab-group">
        <TabGroupTitle id="tab-group-title" class="remark-container-title tab-group">
          Tab Group Title
        </TabGroupTitle>
        <Tab id="first-tab" class="remark-container tab active">
          <TabTitle id="first-tab-title" class="remark-container-title tab">
            First Tab Title
          </TabTitle>
          <p>First Tab Content</p>
        </Tab>
        <Tab id="second-tab" class="remark-container tab">
          <TabTitle id="second-tab-title" class="remark-container-title tab">
            Second Tab Title
          </TabTitle>
          <p>Second Tab Content</p>
        </Tab>
      </TabGroup>
      "
    `);
  });
});
