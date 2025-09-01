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
  mainTitle?: string;
  titleProps?: string[];
} {
  if (!input) return {};

  const match = input.match(REGEX_CUSTOM);

  /* v8 ignore next */
  const [, containerFixture, mainTitle, titleFixture] = match ?? [undefined];

  const nContainerFixture = normalizeIdentifiers(containerFixture);
  const nMainTitle = normalizeIdentifiers(mainTitle);
  const nTitleFixture = normalizeIdentifiers(titleFixture);

  const containerProps =
    nContainerFixture && nContainerFixture !== "" ? nContainerFixture.split(" ") : undefined;

  const titleProps =
    nTitleFixture && nTitleFixture !== "" ? nTitleFixture.split(" ") : undefined;

  return { containerProps, mainTitle: nMainTitle || undefined, titleProps };
}

describe("regex for custom props", () => {
  it("gets custom props 1", () => {
    const input = "{  details#xxx   .fff.ggg  } Title  My    Spaces { summary   #box }";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
          ".ggg",
        ],
        "mainTitle": "Title My Spaces",
        "titleProps": [
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
        "mainTitle": "Title My Spaces",
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
        "mainTitle": "Title My Spaces",
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
        "mainTitle": undefined,
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
        "mainTitle": undefined,
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
        "mainTitle": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 7", () => {
    const input = "{   } Title  My    Spaces {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 8", () => {
    const input = "{   }   {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 9", () => {
    const input = " {}";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 10", () => {
    const input = " ";

    expect(extractSpecificIdentifiers(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });
});
