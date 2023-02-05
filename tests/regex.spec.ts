import { REGEX_START } from "../src";

type Fixture = {
  input: string;
  expect: null | {
    type: undefined | string;
    title: undefined | string;
  };
};

describe("remark-container", () => {
  it("REGEX_CUSTOM_CONTAINER matches with custom container", () => {
    const fixtures: Fixture[] = [
      {
        input: ":::",
        expect: {
          type: undefined,
          title: undefined,
        },
      },
      {
        input: ":::     ",
        expect: {
          type: undefined,
          title: undefined,
        },
      },
      {
        input: ":: : info",
        expect: null,
      },
      {
        input: ":::warning",
        expect: {
          type: "warning",
          title: undefined,
        },
      },
      {
        input: "::: warning",
        expect: {
          type: "warning",
          title: undefined,
        },
      },
      {
        input: ":::    warning   ",
        expect: {
          type: "warning",
          title: undefined,
        },
      },
      {
        input: "::: danger Title",
        expect: {
          type: "danger",
          title: "Title",
        },
      },
      {
        input: ":::    danger        Title  ",
        expect: {
          type: "danger",
          title: "Title",
        },
      },
      {
        input: "::: danger My Title",
        expect: {
          type: "danger",
          title: "My Title",
        },
      },
      {
        input: ":::    danger    My   Title  'flexible'   ",
        expect: {
          type: "danger",
          title: "My   Title  'flexible'",
        },
      },
    ];

    fixtures.forEach((fixture, index) => {
      const match = fixture.input.match(REGEX_START);

      if (fixture.expect === null) {
        expect(match).toBeNull();
      } else {
        expect(match).not.toBeNull();
      }

      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, __, type, title] = match;

        expect(type).toBe(fixture.expect?.type);
        expect(title).toBe(fixture.expect?.title);
      }
    });
  });
});
