import { describe, it, expect } from "vitest";
import dedent from "dedent";

import { process } from "./util/index";

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

  // ******************************************
  it("something exists before", async () => {
    const input = dedent`
      x::: warning
      Hello
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p>x::: warning
      Hello
      :::</p>"
    `);
  });

  // ******************************************
  it("other phrase exists before", async () => {
    const input = dedent`
      *x*::: warning
      Hello
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p><em>x</em>::: warning
      Hello
      :::</p>"
    `);
  });

  // ******************************************
  it("something exists after", async () => {
    const input = dedent`
      ::: warning
      Hello
      ::: x
    `;

    expect(await process(input)).toMatchInlineSnapshot(`
      "<p>Hello
      ::: x</p>"
    `);
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
  it("No type, no title, with content (no empty lines)", async () => {
    const input = dedent`
      :::
      **bold**
      :::
    `;

    expect(await process(input)).toMatchInlineSnapshot(
      `"<div class="remark-container"><p><strong>bold</strong></p></div>"`,
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
