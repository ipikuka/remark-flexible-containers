import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { process } from "./util/index";

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
      `"<div class=\"remark-container tab-group\"><div class=\"remark-container-title tab-group\">My Group</div><div class=\"remark-container tab\"><div class=\"remark-container-title tab\">Some Tab</div></div><div class=\"remark-container tab\"><div class=\"remark-container-title tab\">Another tab</div></div></div>"`,
    );
  });
});
