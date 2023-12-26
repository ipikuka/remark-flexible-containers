import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import dedent from "dedent";
import type { VFileCompatible } from "vfile";

import plugin from "../src";

/**
 * Returns the Title Case of a given string
 */
function toTitleCase(str: string) {
  return str.replace(/\b\w+('\w{1})?/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

const compiler = unified()
  .use(remarkParse)
  .use(gfm)
  .use(plugin, {
    containerTagName(type) {
      return type ? "section" : "div";
    },
    containerClassName(type) {
      return type
        ? [`remark-custom-container-${type}`]
        : ["remark-custom-container", "typeless"];
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
  })
  .use(remarkRehype)
  .use(rehypeStringify);

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("with options - fail", () => {
  // ******************************************
  it("No type, no title, no content", async () => {
    const input = dedent`
      :::
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
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

    expect(await process(input)).toMatchInlineSnapshot(`
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

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-custom-container typeless"><span class="remark-custom-title typeless">Generic Title</span><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container-danger" data-type="danger" data-title="title"><h2 class="remark-custom-title-danger" data-type="danger" data-title="TITLE">Title</h2><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></section>"`,
    );
  });
});
