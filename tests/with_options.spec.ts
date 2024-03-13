import dedent from "dedent";

import { type FlexibleContainerOptions } from "../src";
import { process } from "./util/index";

const options: FlexibleContainerOptions = {
  containerTagName: "section",
  containerClassName: "remark-custom-container",
  containerProperties(type, title) {
    return {
      ["data-type"]: type,
      title,
      dummy: "", // shouldn't be added
      empty: [], // shouldn't be added
      className: undefined, // shouldn't be taken account
    };
  },
  titleTagName: "span",
  titleClassName: "remark-custom-container-title",
  titleProperties: (type, title) => {
    return {
      ["data-type"]: type,
      ["data-title"]: title?.toUpperCase(),
      dummy: "", // shouldn't be added
      empty: [], // shouldn't be added
      className: undefined, // shouldn't be taken account
    };
  },
};

describe("with options - fail", () => {
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

describe("with options - success", () => {
  // ******************************************
  it("No type, no title, with content", async () => {
    const input = dedent`
      :::

      content
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container"><p>content</p></section>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container info" data-type="info"></section>"`,
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
      `"<section class="remark-custom-container danger" data-type="danger"><p>content</p></section>"`,
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
      `"<section class="remark-custom-container danger" data-type="danger" title="Title"><span class="remark-custom-container-title danger" data-type="danger" data-title="TITLE">Title</span><p>content</p></section>"`,
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
      `"<section class="remark-custom-container danger" data-type="danger" title="My Title"><span class="remark-custom-container-title danger" data-type="danger" data-title="MY TITLE">My Title</span><p>content</p></section>"`,
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
      `"<section class="remark-custom-container danger" data-type="danger" title="Title"><span class="remark-custom-container-title danger" data-type="danger" data-title="TITLE">Title</span><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></section>"`,
    );
  });
});
