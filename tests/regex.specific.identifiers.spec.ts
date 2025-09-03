import { describe, it, expect } from "vitest";
import { REGEX_CUSTOM } from "../src/index";

/**
 *
 * normalize specific identifiers "{section#id.classname}" --> "section #id .classname"
 *
 */
function normalizeIdentifiers(input?: string): string | undefined {
  return input
    ?.replace(/[{}]/g, "")
    .replace(/\./g, " .")
    .replace(/#/g, " #")
    .replace(/@/g, " @")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 *
 * extract specific identifiers in curly braces for container and title nodes
 * ::: type {section#foo} title {span.bar}
 *
 */
function extractSpecificIdentifiers(input?: string): {
  containerProps?: string[];
  title?: string;
  titleProps?: string[];
} {
  if (!input) return {};

  const match = input.match(REGEX_CUSTOM);

  const nContainerFixture = normalizeIdentifiers(match?.[1]);
  const nMainTitle = normalizeIdentifiers(match?.[2]);
  const nTitleFixture = normalizeIdentifiers(match?.[3]);

  const containerProps = (nContainerFixture || undefined)?.split(" ");
  const title = nMainTitle || undefined;
  const titleProps = (nTitleFixture || undefined)?.split(" ");

  return { containerProps, title, titleProps };
}

describe("regex for custom props", () => {
  it("gets custom props 1", () => {
    const input =
      "{  details#xxx   .fff.ggg@open  } Title  My    Spaces { @data-type=ex summary   #box }";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
          ".ggg",
          "@open",
        ],
        "title": "Title My Spaces",
        "titleProps": [
          "@data-type=ex",
          "summary",
          "#box",
        ],
      }
    `);
  });

  it("gets custom props 2", () => {
    const input = " Title  My    Spaces { summary   #box }";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": "Title My Spaces",
        "titleProps": [
          "summary",
          "#box",
        ],
      }
    `);
  });

  it("gets custom props 3", () => {
    const input = "{  details#xxx   .fff  } Title  My    Spaces ";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
        ],
        "title": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 4", () => {
    const input = "{  details#xxx   .fff  }";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
        ],
        "title": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 5", () => {
    const input = "{  details#xxx   .fff  }   { summary   #box }";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
        ],
        "title": undefined,
        "titleProps": [
          "summary",
          "#box",
        ],
      }
    `);
  });

  it("gets custom props 6", () => {
    const input = " Title  My    Spaces ";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 7", () => {
    const input = "{   } Title  My    Spaces {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 8", () => {
    const input = "{   }   {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 9", () => {
    const input = " {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 10", () => {
    const input = " ";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "title": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 11", () => {
    const input = "{section@open.someclass} Title {@a@b#id@data-type=xxx span}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "section",
          "@open",
          ".someclass",
        ],
        "title": "Title",
        "titleProps": [
          "@a",
          "@b",
          "#id",
          "@data-type=xxx",
          "span",
        ],
      }
    `);
  });
});
