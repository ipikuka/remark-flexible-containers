import { unified } from "unified";
import remarkParse from "remark-parse";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import dedent from "dedent";
import type { VFileCompatible } from "vfile";

import plugin from "../src";

const compiler = unified()
  .use(remarkParse)
  .use(gfm)
  .use(plugin)
  .use(remarkRehype)
  .use(rehypeStringify);

const process = async (contents: VFileCompatible): Promise<VFileCompatible> => {
  return compiler.process(contents).then((file) => file.value);
};

describe("no options - fail", () => {
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
  it("No type, no title, no content", async () => {
    const input = dedent`
      :::
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p>:::
      :::</p>"
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

  // ******************************************
  it("Type mis-placed, no title, no content", async () => {
    const input = dedent`
      :::
      ::: tip
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p>:::
      ::: tip</p>"
    `);
  });

  // ******************************************
  it("All type, title and closing signs are in one line", async () => {
    const input = dedent`      
      :::danger Title:::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`"<p>:::danger Title:::</p>"`);
  });
});

describe("no options - success", () => {
  // ******************************************
  it("No type, no title, with content", async () => {
    const input = dedent`
      :::

      content
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("No type, no title, with content (no empty lines)", async () => {
    const input = dedent`
      :::
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content", async () => {
    const input = dedent`
      ::: info
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container info"></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, no content (no empty lines)", async () => {
    const input = dedent`
      ::: info
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container info"></div>"`,
    );
  });

  // ******************************************
  it("No content, but type and title are defined", async () => {
    const input = dedent`      
      ::: danger Title

      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div></div>"`,
    );
  });

  // ******************************************
  it("No content, but type and title are defined (no empty lnes)", async () => {
    const input = dedent`      
      ::: danger Title
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div></div>"`,
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
      `"<div class="remark-container danger"><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, with content (no empty lines)", async () => {
    const input = dedent`
      ::: danger
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
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

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined (no empty lines)", async () => {
    const input = dedent`
      ::: danger Title
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p>content</p></div>"`,
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
      `"<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p>content</p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined; with extreme spaces (no empty lines)", async () => {
    const input = dedent`
      :::danger      My      Title       
      content
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p>content</p></div>"`,
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
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><strong>bold text</strong> paragraph</p><p>other paragraph <em>italic content</em></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined, more content (no empty lines)", async () => {
    const input = dedent`
      ::: danger Title
      **bold text** paragraph
      other paragraph *italic content*
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><strong>bold text</strong> paragraph
      other paragraph <em>italic content</em></p></div>"
    `);
  });
});
