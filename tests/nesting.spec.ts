import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { process } from "./util/index";
import { type FlexibleContainerOptions } from "../src";

describe("nesting with varying fence lengths", () => {
  it("supports an outer 4-colon container with inner 3-colon containers", async () => {
    const input = dedent`
      :::: tab-group My Group
      
      ::: tab Some Tab
      :::
      
      ::: tab Another tab
      :::

      ::::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container tab-group"><div class="remark-container-title tab-group">My Group</div><div class="remark-container tab"><div class="remark-container-title tab">Some Tab</div></div><div class="remark-container tab"><div class="remark-container-title tab">Another tab</div></div></div>"`,
    );
  });

  it("supports custom component names (TabGroup/CodeTab) and custom title components", async () => {
    const options: FlexibleContainerOptions = {
      containerTagName(type) {
        if (type === "tab-group") return "TabGroup";
        if (type === "tab") return "CodeTab";
        return "div";
      },
      containerClassName(type) {
        if (type === "tab-group") return ["tab-group"];
        if (type === "tab") return ["tab"];
        return ["remark-container", type ?? ""];
      },
      titleTagName(type) {
        if (type === "tab-group") return "TabGroupTitle";
        if (type === "tab") return "CodeTabTitle";
        return "div";
      },
      titleClassName(type) {
        if (type === "tab-group") return ["tab-group-title"];
        if (type === "tab") return ["tab-title"];
        return ["remark-container-title"];
      },
    };

    const input = dedent`
      :::: tab-group My Group

      ::: tab Some Tab
      :::
      
      ::: tab Another tab
      :::
      
      ::::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<TabGroup class="tab-group"><TabGroupTitle class="tab-group-title">My Group</TabGroupTitle><CodeTab class="tab"><CodeTabTitle class="tab-title">Some Tab</CodeTabTitle></CodeTab><CodeTab class="tab"><CodeTabTitle class="tab-title">Another tab</CodeTabTitle></CodeTab></TabGroup>"`,
    );
  });

  it("supports custom tag names (tab-group/code-tab) and custom title tags", async () => {
    const options: FlexibleContainerOptions = {
      containerTagName(type) {
        if (type === "tab-group") return "tab-group";
        if (type === "tab") return "code-tab";
        return "div";
      },
      containerClassName(type) {
        if (type === "tab-group") return ["tabs"];
        if (type === "tab") return ["tab"];
        return ["remark-container", type ?? ""];
      },
      titleTagName(type) {
        if (type === "tab-group") return "tab-group-title";
        if (type === "tab") return "code-tab-title";
        return "div";
      },
      titleClassName(type) {
        if (type === "tab-group") return ["tabs-title"];
        if (type === "tab") return ["tab-title"];
        return ["remark-container-title"];
      },
    };

    const input = dedent`
      :::: tab-group My Group

      ::: tab First
      :::
      
      ::: tab Second
      :::
      
      ::::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<tab-group class="tabs"><tab-group-title class="tabs-title">My Group</tab-group-title><code-tab class="tab"><code-tab-title class="tab-title">First</code-tab-title></code-tab><code-tab class="tab"><code-tab-title class="tab-title">Second</code-tab-title></code-tab></tab-group>"`,
    );
  });

  it("supports passing custom properties to containers and titles", async () => {
    const options: FlexibleContainerOptions = {
      containerTagName(type) {
        if (type === "tab-group") return "tab-group";
        if (type === "tab") return "code-tab";
        return "div";
      },
      containerClassName(type) {
        if (type === "tab-group") return ["tabs"];
        if (type === "tab") return ["tab"];
        return ["remark-container", type ?? ""];
      },
      containerProperties(type, title) {
        if (type === "tab-group") return { role: "tablist", "data-kind": "group" } as const;
        if (type === "tab") return { role: "tab", "data-tab": title } as const;
        return {} as const;
      },
      titleTagName(type) {
        if (type === "tab-group") return "tab-group-title";
        if (type === "tab") return "code-tab-title";
        return "div";
      },
      titleClassName(type) {
        if (type === "tab-group") return ["tabs-title"];
        if (type === "tab") return ["tab-title"];
        return ["remark-container-title"];
      },
      titleProperties(type, title) {
        if (type === "tab-group") return { "data-title": title } as const;
        if (type === "tab") return { "aria-selected": title === "Active" } as const;
        return {} as const;
      },
    };

    const input = dedent`
      :::: tab-group My Group

      ::: tab Active
      :::
      
      ::: tab Passive
      :::
      
      ::::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<tab-group class="tabs" role="tablist" data-kind="group"><tab-group-title class="tabs-title" data-title="My Group">My Group</tab-group-title><code-tab class="tab" role="tab" data-tab="Active"><code-tab-title class="tab-title" aria-selected>Active</code-tab-title></code-tab><code-tab class="tab" role="tab" data-tab="Passive"><code-tab-title class="tab-title">Passive</code-tab-title></code-tab></tab-group>"`,
    );
  });

  it("supports inline specific identifiers for tags/ids/classes for nested containers", async () => {
    const input = dedent`
      :::: tab-group {tab-group#group.tabs} My Group {tab-group-title#group-title.title}
      
      ::: tab {code-tab#t1.pill} Active {code-tab-title#t1-title.pill-title}
      :::
      
      ::: tab {code-tab#t2.pill} Passive {code-tab-title#t2-title.pill-title}
      :::
      
      ::::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<tab-group class="remark-container tab-group tabs" id="group"><tab-group-title class="remark-container-title tab-group title" id="group-title">My Group</tab-group-title><code-tab class="remark-container tab pill" id="t1"><code-tab-title class="remark-container-title tab pill-title" id="t1-title">Active</code-tab-title></code-tab><code-tab class="remark-container tab pill" id="t2"><code-tab-title class="remark-container-title tab pill-title" id="t2-title">Passive</code-tab-title></code-tab></tab-group>"`,
    );
  });
});

// add a test for this with tags specified, e.g.
// ### ::: [type] [{tagname#id.classname}] [title] [{tagname#id.classname}]

// so it's "<tab-group> and <single-tab>"

describe("nesting with PascalCase brace syntax", () => {
  it("supports inline specific identifiers with PascalCase tag names (TabGroup/CodeTab)", async () => {
    const input = dedent`
      :::: tab-group {TabGroup#group.tabs} My Group {TabGroupTitle#group-title.title}
      
      ::: tab {CodeTab#t1.pill} Active {CodeTabTitle#t1-title.pill-title}
      :::
      
      ::: tab {CodeTab#t2.pill} Passive {CodeTabTitle#t2-title.pill-title}
      :::
      
      ::::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<TabGroup class="remark-container tab-group tabs" id="group"><TabGroupTitle class="remark-container-title tab-group title" id="group-title">My Group</TabGroupTitle><CodeTab class="remark-container tab pill" id="t1"><CodeTabTitle class="remark-container-title tab pill-title" id="t1-title">Active</CodeTabTitle></CodeTab><CodeTab class="remark-container tab pill" id="t2"><CodeTabTitle class="remark-container-title tab pill-title" id="t2-title">Passive</CodeTabTitle></CodeTab></TabGroup>"`,
    );
  });
});
