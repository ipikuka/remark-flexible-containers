import dedent from "dedent";

import { type FlexibleContainerOptions } from "../src";
import { process } from "./util/index";

/**
 * Returns the Title Case of a given string
 */
function toTitleCase(str: string) {
  return str.replace(/\b\w+('\w{1})?/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

const options: FlexibleContainerOptions = {
  containerTagName(type) {
    return type ? "section" : "div";
  },
  containerClassName(type) {
    return type ? [`remark-custom-container-${type}`] : ["remark-custom-container", "typeless"];
  },
  containerProperties(type, title) {
    return {
      ["data-type"]: type,
      ["data-title"]: title,
    };
  },
  title: (type, title) => {
    return title ? toTitleCase(title) : type ? toTitleCase(type) : "Generic Title";
  },
  titleTagName(type) {
    return type ? "h2" : "span";
  },
  titleClassName(type) {
    return type ? [`remark-custom-title-${type}`] : ["remark-custom-title", "typeless"];
  },
  titleProperties: (type, title) => {
    return {
      ["data-type"]: type,
      ["data-title"]: title?.toUpperCase(),
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
      `"<div class="remark-custom-container typeless"><span class="remark-custom-title typeless">Generic Title</span><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container-info" data-type="info"><h2 class="remark-custom-title-info" data-type="info">Info</h2></section>"`,
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
      `"<section class="remark-custom-container-danger" data-type="danger"><h2 class="remark-custom-title-danger" data-type="danger">Danger</h2><p>content</p></section>"`,
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
      `"<section class="remark-custom-container-danger" data-type="danger" data-title="Title"><h2 class="remark-custom-title-danger" data-type="danger" data-title="TITLE">Title</h2><p>content</p></section>"`,
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
      `"<section class="remark-custom-container-danger" data-type="danger" data-title="My Title"><h2 class="remark-custom-title-danger" data-type="danger" data-title="MY TITLE">My Title</h2><p>content</p></section>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined, more content", async () => {
    const input = dedent`
        ::: danger title
  
        **bold text** paragraph

        other paragraph *italic content*
        
        :::
      `;

    expect(await process(input, options)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container-danger" data-type="danger" data-title="title"><h2 class="remark-custom-title-danger" data-type="danger" data-title="TITLE">Title</h2><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></section>"`,
    );
  });
});
