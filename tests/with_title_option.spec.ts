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
    containerTagName: "section",
    containerClassName: "remark-custom-container",
    containerProperties: (type, title) => ({ ["data-type"]: type, title }),
    title: (type, title) => {
      return title ? toTitleCase(title) : type ? toTitleCase(type) : "Generic Title";
    },
    titleTagName: "span",
    titleClassName: "remark-custom-container-title",
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
      `"<section class="remark-custom-container"><span class="remark-custom-container-title">Generic Title</span><p>content</p></section>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container info" data-type="info"><span class="remark-custom-container-title info" data-type="info">Info</span></section>"`,
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
      `"<section class="remark-custom-container danger" data-type="danger"><span class="remark-custom-container-title danger" data-type="danger">Danger</span><p>content</p></section>"`,
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

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
      `"<section class="remark-custom-container danger" data-type="danger" title="Title"><span class="remark-custom-container-title danger" data-type="danger" data-title="TITLE">Title</span><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></section>"`,
    );
  });
});
