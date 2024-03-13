import { REGEX_CUSTOM } from "../src/index";

// Define a custom string method
String.prototype.normalize = function () {
  return this?.replace(/[{}]/g, "")
    .replace(".", " .")
    .replace("#", " #")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * the matched title may contain additional props for container and title node
 * in curly braces like: {section#foo} Title {span.bar}
 *
 */
function getCustomProps(input: string) {
  const match = input.match(REGEX_CUSTOM);

  // eslint-disable-next-line
  let [input_, containerFixture, mainTitle, titleFixture] = match ?? [undefined];

  containerFixture = containerFixture?.normalize();

  const containerProps =
    containerFixture && containerFixture !== "" ? containerFixture?.split(" ") : undefined;

  titleFixture = titleFixture?.normalize();

  const titleProps = titleFixture && titleFixture !== "" ? titleFixture?.split(" ") : undefined;

  mainTitle = mainTitle?.normalize();

  mainTitle = mainTitle === "" ? undefined : mainTitle;

  return { containerProps, mainTitle, titleProps };
}

describe("regex for custom props", () => {
  it("gets custom props 1", () => {
    const input = "{  details#xxx   .fff  } Title  My    Spaces { summary   #box }";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": [
          "details",
          "#xxx",
          ".fff",
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

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
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

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
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

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
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

  it("gets custom props 1", () => {
    const input = "{  details#xxx   .fff  }   { summary   #box }";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
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

  it("gets custom props 5", () => {
    const input = " Title  My    Spaces ";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 6", () => {
    const input = "{   } Title  My    Spaces {}";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": "Title My Spaces",
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 6", () => {
    const input = "{   }   {}";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 6", () => {
    const input = " {}";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });

  it("gets custom props 6", () => {
    const input = " ";

    expect(getCustomProps(input)).toMatchInlineSnapshot(`
      {
        "containerProps": undefined,
        "mainTitle": undefined,
        "titleProps": undefined,
      }
    `);
  });
});
