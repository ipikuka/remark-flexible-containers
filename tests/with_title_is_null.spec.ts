import dedent from "dedent";

import { type FlexibleContainerOptions } from "../src";
import { process } from "./util/index";

const options: FlexibleContainerOptions = { title: () => null };

describe("without title - fail", () => {
  // ******************************************
  it("No type, no title, no content", async () => {
    const input = dedent`
      :::
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(`
      "<p>:::</p>
      <p>:::</p>"
    `);
  });

  // ******************************************
  it("Type mis-placed, no title, no content", async () => {
    const input = dedent`
        :::
        
        ::: tip
      `;

    expect(await process(input, options)).toMatchInlineSnapshot(`
      "<p>:::</p>
      <p>::: tip</p>"
    `);
  });
});

describe("without title - success", () => {
  // ******************************************
  it("No type, no title, with content", async () => {
    const input = dedent`
      :::

      content
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container info"></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, with content", async () => {
    const input = dedent`
      ::: danger

      content
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined", async () => {
    const input = dedent`
      ::: danger Title

      content
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined; with extreme spaces", async () => {
    const input = dedent`
        :::danger      My      Title       
  
        content
        
        :::
      `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined, more content", async () => {
    const input = dedent`
        ::: danger Title
  
        **bold text** paragraph

        other paragraph *italic content*
        
        :::
      `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></div>"`,
    );
  });
});
