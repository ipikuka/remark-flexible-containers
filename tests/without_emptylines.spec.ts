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
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

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
      "<p>:::
      ::: tip</p>"
    `);
  });
});

describe("no options - success", () => {
  // ******************************************
  it("No type, no title, with content - without empty line up and down", async () => {
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
  it("No type, no title, with content - without empty line down", async () => {
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
  it("No type, no title, with content - without empty line up", async () => {
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
  it("No type, no title, with content bold - without empty line up and down", async () => {
    const input = dedent`
      :::
      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("No type, no title, with content bold - without empty line down", async () => {
    const input = dedent`
      :::

      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("No type, no title, with content bold - without empty line up", async () => {
    const input = dedent`
      :::
      **content**

      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p><strong>content</strong></p></div>"`,
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
  it("Type is defined, no title, with content - without empty line both", async () => {
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
  it("Type is defined, no title, with content - without empty line down", async () => {
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
  it("Type is defined, no title, with content - without empty line up", async () => {
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
  it("Type is defined, no title, with content bold - without empty line both", async () => {
    const input = dedent`
      ::: danger
      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, with content bold - without empty line down", async () => {
    const input = dedent`
      ::: danger

      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("Type is defined, no title, with content bold - without empty line up", async () => {
    const input = dedent`
    ::: danger
    **content**
    
    :::
  `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined - without empty line up and down", async () => {
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
  it("All type, title and content are defined - without empty line down", async () => {
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
  it("All type, title and content are defined - without empty line up", async () => {
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
  it("All type, title and content bold are defined - without empty line up and down", async () => {
    const input = dedent`
      ::: danger Title
      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content bold are defined - without empty line down", async () => {
    const input = dedent`
      ::: danger Title

      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content bold are defined - without empty line up", async () => {
    const input = dedent`
      ::: danger Title
      **content**

      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined; with extreme spaces - without empty line up and down", async () => {
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
  it("All type, title and content are defined; with extreme spaces - without empty line down", async () => {
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
  it("All type, title and content are defined; with extreme spaces - without empty line up", async () => {
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
  it("All type, title and content bold are defined; with extreme spaces - without empty line up and down", async () => {
    const input = dedent`
      :::danger      My      Title 
      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content bold are defined; with extreme spaces - without empty line down", async () => {
    const input = dedent`
      :::danger      My      Title 
      
      **content**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content bold are defined; with extreme spaces - without empty line up", async () => {
    const input = dedent`
      :::danger      My      Title 
      **content**
      
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p><strong>content</strong></p></div>"`,
    );
  });

  // ******************************************
  it("All type, title and content are defined, more content - without empty line up and down", async () => {
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
  it("All type, title and content are defined, more content - without empty line down", async () => {
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
  it("All type, title and content are defined, more content - without empty line up", async () => {
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
  it("complex", async () => {
    const input = dedent`
        ::: danger   My   Title
        My name is **talatkuyuk** AKA ipikuka
        this package is so _cool italic_
  
        other paragraph *italic content* then
        some **bold content** without stress
        :::
      `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<div class="remark-container danger"><div class="remark-container-title danger">My Title</div><p>My name is <strong>talatkuyuk</strong> AKA ipikuka
      this package is so <em>cool italic</em></p><p>other paragraph <em>italic content</em> then
      some <strong>bold content</strong> without stress</p></div>"
    `);
  });
});
