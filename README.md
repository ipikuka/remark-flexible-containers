# remark-flexible-containers

[![npm version][badge-npm-version]][url-npm-package]
[![npm downloads][badge-npm-download]][url-npm-package]
[![publish to npm][badge-publish-to-npm]][url-publish-github-actions]
[![code-coverage][badge-codecov]][url-codecov]
[![type-coverage][badge-type-coverage]][url-github-package]
[![typescript][badge-typescript]][url-typescript]
[![license][badge-license]][url-license]

This package is a [**unified**][unified] ([**remark**][remark]) plugin **to add custom containers with customizable properties in markdown.**

[**unified**][unified] is a project that transforms content with abstract syntax trees (ASTs) using the new parser [**micromark**][micromark]. [**remark**][remark] adds support for markdown to unified. [**mdast**][mdast] is the Markdown Abstract Syntax Tree (AST) which is a specification for representing markdown in a syntax tree.

**This plugin is a remark plugin that transforms the mdast.**

## When should I use this?

This plugin is useful if you want to **add a custom container** in markdown, for example, in order to produce a **callout** or **admonition**.

- This plugin can add `container` node, with _custom tag name, custom class name and also additional properties_.
- This plugin can add `title` node inside the container, if the title is provided, with _custom tag name, custom class name and also additional properties_.

**This plugin doesn't support nested containers yet.**

## Installation

This package is suitable for ESM only. In Node.js (version 16+), install with npm:

```bash
npm install remark-flexible-containers
```

or

```bash
yarn add remark-flexible-containers
```

## Usage

### ::: [type] [title]

Say we have the following file, `example.md`, which consists a flexible container. The **container type** is "warning", specified _after the triple colon_ `:::`; and the **container title** is "title". **Each container should be closed with the triple colon `:::` at the end.**

```markdown
::: warning title
My paragraph with **bold text**
:::
```

> [!TIP]
> **You don't need to put empty lines inside the container.** 

> [!CAUTION]
> **There must be empty lines before and after the container in order to parse the markdown properly.**

```markdown
<!--- here must be empty line --->
::: warning Title
My paragraph with **bold text**
:::
<!--- here must be empty line --->
```

And our module, `example.js`, looks as follows:

```javascript
import { read } from "to-vfile";
import remark from "remark";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFlexibleContainers from "remark-flexible-containers";

main();

async function main() {
  const file = await remark()
    .use(gfm)
    .use(remarkFlexibleContainers)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(await read("example.md"));

  console.log(String(file));
}
```

Now, running `node example.js` yields:\
_(The `type` of the container is also added **as a class name** into the `container` node and the `title` node)_

```html
<div class="remark-container warning">
  <div class="remark-container-title warning">Title</div>
  <p>My paragraph with <strong>bold text</strong></p>
</div>
```

Without `remark-flexible-containers`, you’d get:

```html
<p>::: warning Title
My paragraph with <strong>bold text</strong>
:::</p>
```

## It is more flexible and powerful

### ::: [type] [{tagname#id.classname}] [title] [{tagname#id.classname}]

As of version `^1.2.0`, the `remark-flexible-containers` supports syntax for specific identifiers (`tagname`, `id`, `classnames`) **for individual `container` and `title` node.** For example:

``` markdown
::: info {section#foo.myclass} Title Of Information {span#baz.someclass}
<!-- content -->
:::
```

```html
<section class="remark-container info myclass" id="foo">
  <span class="remark-container-title info someclass" id="baz">
    Title Of Information
  </span>
  <!-- content -->
</section>
```

For more information, go to [detailed explanation](#support-for-specific-identifiers) placed after the "options" and "examples" section.

## Options

All options are **optional** and have **default values**.

```typescript
type RestrictedRecord = Record<string, unknown> & { className?: never };

type TagNameFunction = (type?: string, title?: string) => string;
type ClassNameFunction = (type?: string, title?: string) => string[];
type PropertyFunction = (type?: string, title?: string) => RestrictedRecord;
type TitleFunction = (type?: string, title?: string) => string | null | undefined;

use(remarkFlexibleContainers, {
  containerTagName?: string | TagNameFunction; // default is "div"
  containerClassName?: string | ClassNameFunction; // default is "remark-container"
  containerProperties?: PropertyFunction;
  title?: TitleFunction;
  titleTagName?: string | TagNameFunction; // default is "div"
  titleClassName?: string | ClassNameFunction; // // default is "remark-container-title"
  titleProperties?: PropertyFunction;
} as FlexibleContainerOptions);
```

#### `containerTagName`

It is a **string** or a **callback** `(type?: string, title?: string) => string` option for providing custom HTML tag name for the `container` node.

By default, it is `div`.

```javascript
use(remarkFlexibleContainers, {
  containerTagName: "section";
});
```

Now, the container tag names will be `section`.

```html
<section class="...">
  <!-- ... -->
</section>
```

The option can take also a callback function, which has two optional arguments `type` and `title`, and returns **string** representing a **custom tag name**. 

```javascript
use(remarkFlexibleContainers, {
  containerTagName: (type, title) => {
    return type === "details" ? "details" : "div";
  }
});
```

Now, the container tag names will be `div` or `details`. It is a good start for creating `details-summary` HTML elements in markdown.

```markdown
::: details Title
<!-- ... -->
:::

::: warning Title
<!-- ... -->
:::
```

```html
<details class="...">
  <!-- ... -->
</details>
<div class="...">
  <!-- ... -->
</div>
```

#### `containerClassName`

It is a **string** or a **callback** `(type?: string, title?: string) => string[]` option for providing custom class name for the `container` node. 

By default, it is `remark-container`, and all container nodes' classnames will contain `remark-container`.

A container node contains also a **secondary class name** representing the **type** of the container, like `warning` or `info`. If there is no `type` of the container, then the secondary class name will not present.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="remark-container danger">
  <!-- ... -->
</div>
```

```javascript
use(remarkFlexibleContainers, {
  containerClassName: "custom-container";
});
```

Now, the container nodes will have `custom-container` as a className, and the secondary class names will be the `type` of the container, if exists.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="custom-container danger">
  <!-- ... -->
</div>
```

The option can take also a callback function, which has two optional arguments `type` and `title`, and returns **array of strings** representing **class names**. 

```javascript
use(remarkFlexibleContainers, {
  containerClassName: (type, title) => {
    return [`remark-container-${type ?? "note"}`]
  };
});
```

Now, the container class names **will contain only one class name** like `remark-container-warning`, `remark-container-note` etc.

```markdown
:::
<!-- ... -->
:::
```

```html
<div class="remark-container-note">
  <!-- ... -->
</div>
```

> [!WARNING]
> **If you use the `containerClassName` option as a callback function, it is your responsibility to define class names, add the type of the container into class names etc. in an array.**

#### `containerProperties`

It is a **callback** `(type?: string, title?: string) => Record<string, unknown> & { className?: never }` option to set additional properties for the `container` node. 

The callback function that takes the `type` and the `title` as optional arguments and returns **object** which is going to be used for adding additional properties into the `container` node.

**The `className` key is forbidden and effectless in the returned object.**

```javascript
use(remarkFlexibleContainers, {
  containerProperties(type, title) {
    return {
      ["data-type"]: type,
      ["data-title"]: title,
    };
  },
});
```

Now, the container nodes which have a type and a title will contain `data-type` and `data-title` properties.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="remark-container danger" data-type="danger" data-title="Title">
  <!-- ... -->
</div>
```

#### `title`

It is a **callback** `(type?: string, title?: string) => string | null | undefined` option to set the title with a callback function.

The `remark-flexible-containers` adds a `title` node normally if a title is provided in markdown.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="remark-container danger">
  <div class="remark-container-title">Title</div>
  <!-- ... -->
</div>
```

if the callback function returns **null** `title: () => null`, the plugin will not add the `title` node.

```javascript
use(remarkFlexibleContainers, {
  title: () => null,
});
```

```html
<div class="remark-container danger">
  <!-- There will be NO title node -->
  <!-- ... -->
</div>
```

The callback function takes the `type` and the `title` as optional arguments and returns **string | null | undefined**. For example if there is no title you would want the title is the type of the container as a fallback.

```javascript
use(remarkFlexibleContainers, {
  title: (type, title) => {
    return title ?? type ? type.charAt(0).toUpperCase() + type.slice(1) : "Fallback Title";
  },
});
```

```markdown
::: info Title
<!-- ... -->
:::

::: info
<!-- ... -->
:::

:::
<!-- ... -->
:::
```

```html
<div class="remark-container info">
  <div class="remark-container-title info">Title</div>
  <!-- ... -->
</div>
<div class="remark-container info">
  <div class="remark-container-title info">Info</div>
  <!-- ... -->
</div>
<div class="remark-container">
  <div class="remark-container-title">Fallback Title</div>
  <!-- ... -->
</div>
```

#### `titleTagName`

It is a **string** or a **callback** `(type?: string, title?: string) => string` option for providing custom HTML tag name for the `title` node.

By default, it is `div`.

```javascript
use(remarkFlexibleContainers, {
  titleTagName: "span";
});
```

Now, the title tag names will be `span`.

```html
<div class="...">
  <span class="...">Title</span>
  <!-- ... -->
</div>
```

The option can take also a callback function, which has two optional arguments `type` and `title`, and returns **string** representing a **custom tag name**.

```javascript
use(remarkFlexibleContainers, {
  containerTagName: (type, title) => {
    return type === "details" ? "details" : "div";
  },
  titleTagName: (type, title) => {
    return type === "details" ? "summary" : "span";
  }
});
```

Now, the container tag names will be `span` or `summary`. It is a good complementary for creating `details-summary` HTML elements in markdown.

```markdown
::: details Title
<!-- ... -->
:::

::: warning Title
<!-- ... -->
:::
```

```html
<details class="...">
  <summary class="...">Title</summary>
  <!-- ... -->
</details>
<div class="...">
  <span class="...">Title</span>
  <!-- ... -->
</div>
```

#### `titleClassName`

It is a **string** or a **callback** `(type?: string, title?: string) => string[]` option for providing custom class name for the `title` node.

By default, it is `remark-container-title`, and all title nodes'  classnames will contain `remark-container-title`.

A title node contains also a **secondary class name** representing the **type** of the container, like `warning` or `info`. If there is no `type` of the container, then the secondary class name will not present.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="...">
  <div class="remark-container-title danger">Title</div>
  <!-- ... -->
</div>
```

```javascript
use(remarkFlexibleContainers, {
  titleClassName: "custom-container-title";
});
```

Now, the title nodes will have `custom-container-title` as a className, and the secondary class names will be the `type` of the container, if exists.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="...">
  <div class="custom-container-title danger">Title</div>
  <!-- ... -->
</div>
```

The option can take also a callback function, which has two optional arguments `type` and `title`, and returns **array of strings** representing **class names**. 

```javascript
use(remarkFlexibleContainers, {
  titleClassName: (type, title) => {
    return type ? [`container-title-${type}`] : ["container-title"]
  };
});
```

Now, the container class names **will contain only one class name** like `container-title-warning`, `container-title` etc.

```markdown
::: tip Title
<!-- ... -->
:::

:::
<!-- ... -->
:::
```

```html
<div class="...">
  <div class="container-title-tip">Title</div>
  <!-- ... -->
</div>

<div class="...">
  <!-- No title node because there is no title in the second container
   and no fallback title with `title` option  -->
  <!-- ... -->
</div>
```

> [!WARNING]
> **If you use the `titleClassName` option as a callback function, it is your responsibility to define class names, add the type of the container into class names etc. in an array.**

#### `titleProperties`

It is a **callback** `(type?: string, title?: string) => Record<string, unknown> & { className?: never }` option to set additional properties for the `title` node. 

The callback function that takes the `type` and the `title` as optional arguments and returns **object** which is going to be used for adding additional properties into the `title` node.

**The `className` key is forbidden and effectless in the returned object.**

```javascript
use(remarkFlexibleContainers, {
  titleProperties(type, title) {
    return {
      ["data-type"]: type,
    };
  },
});
```

Now, the title nodes which have a type will contain `data-type` property.

```markdown
::: danger Title
<!-- ... -->
:::
```

```html
<div class="...">
  <div class="..." data-type="danger">Title</div>
  <!-- ... -->
</div>
```

## Examples:

```markdown
::: info The Title of Information
Some information
:::
```

#### Without any option

```javascript
use(remarkFlexibleContainers);
```

is going to produce as default:

```html
<div class="remark-container info">
  <div class="remark-container-title info">The Title of Information</div>
  <p>Some information</p>
</div>
```

#### With the title option is `() => null`

```javascript
use(remarkFlexibleContainers, {
  title: () => null,
});
```

is going to produce the container without title node (even if the the title is provided in markdown):

```html
<div class="remark-container info">
  <p>Some information</p>
</div>
```

#### With options

```javascript
use(remarkFlexibleContainers, {
  containerTagName: "section",
  containerClassName: "remark-custom-wrapper",
  containerProperties(type, title) {
    return {
      ["data-type"]: type,
      ["data-title"]: title,
    };
  },
  title: (type, title) => title ? title.toUpperCase() : "Fallback Title";
  titleTagName: "span",
  titleClassName: "remark-custom-wrapper-title",
  titleProperties: (type, title) => {
      ["data-type"]: type,
  },
});
```

is going to produce the container `section` element like below:

```html
<section class="remark-custom-wrapper info" data-type="info" data-title="The Title of Information">
  <span class="remark-custom-wrapper-title info" data-type="info">THE TITLE OF INFORMATION</span>
  <p>Some information</p>
</section>
```

#### With options having callback functions for the tag names and the class names.

```javascript
use(remarkFlexibleContainers, {
  containerTagName(type) {
    return type === "details" ? "details" : "div";
  },
  containerClassName(type) {
    return type === "details" ? ["remark-details"] : ["remark-container", type ?? ""];
  },
  titleTagName(type) {
    return type === "details" ? "summary" : "span";
  },
  titleClassName(type) {
    return type === "details" ? ["remark-summary"] : ["remark-container-title", type ?? ""];
  },
});
```

With above options you can create `details-summary` HTML element in addition to containers easily if you provide the type of the container as `details`.

```markdown
::: details Title
Some information
:::

::: warning Title
Some information
:::
```

```html
<details class="remark-details">
  <summary class="remark-summary">Title</summary>
  <p>Some information</p>
</details>
<div class="remark-container warning">
  <span class="remark-container warning">Title</span>
  <p>Some information</p>
</div>
```

#### Without a type and a title

You can use the plugin syntax without providing a type and a title.

```markdown
:::
Some information
:::
```

It will not add a `title` node since it is not provided (assume that `title` option is not provided for a fallback title, as well), and it will also not add the type as a classname into the container:

```html
<div class="remark-container">
  <p>Some information</p>
</div>
```

**The flexible container can contain also HTML elements and MDX components:**

```markdown
::: tip Title
This package is so _**cool** and **flexible**_

::it does not confuse with double colons::

==marked text via plugin `remark-flexible-markers`==
<mark>marked text via HTML element in markdown</mark>
<MarkRed>marked text via custom marker in support of MDX</MarkRed>

<details>
  <summary>HTML tag works too</summary>
  <p>I am working</p>
</details>
  
other paragraph *italic content* and,
some **bold content** without stress
:::
```

## Support for Specific Identifiers

### ::: [type] [{tagname#id.classname}] [title] [{tagname#id.classname}]

As of version `^1.2.0`, the `remark-flexible-containers` supports syntax for specific identifiers (`tagname`, `id`, `classnames`) **for individual `container` and `title` node.** For example:

``` markdown
::: info {section#foo.myclass} Title Of Information {span#baz.someclass}
<!-- content -->
:::
```

```html
<section class="remark-container info myclass" id="foo">
  <span class="remark-container-title info someclass" id="baz">
    Title Of Information
  </span>
  <!-- content -->
</section>
```
The identifiers (`tagname`, `id`, `classnames`) **must be inside curly braces**. 

Syntax is very simple.
+ `tagname` is to be compatible HTML tag name, and may present only once,
+ `id` is to start with hash **`#`**, and may present only once,
+ `classnames` are to start with dot **`.`**, and may present many.

There are two groups of identifiers. Each group is optional, may present or not.\
**The first group of identifiers** _(just after the `type`)_ is for `container` node.\
**The second group of identifiers** _(just after the `title`)_ is for `title` node.

**Here are some example usages.** *For simplicity*, I omitted the container contents and ending syntax, just put the beginning syntax in the examples. **All are valid usage for specific identifiers.**

> [!TIP]
> **These identifiers can be placed as all three, any two, or just any of them in the desired order, with or without a space between them.** This is why the "flexibility" term comes from.

```markdown
::: info {section#foo.myclass.second-class} Title {span#baz.someclass.other-class}
::: info {section#foo.myclass} Title {span#baz.someclass}
::: info {section #foo .myclass .second-class} Title {span #baz .someclass .other-class}
::: info {section #foo .myclass} Title {span #baz .someclass}
::: info {section.myclass#foo} Title {span.someclass#baz}
::: info {.myclass#foo} Title {.someclass#baz}
::: info {.myclass #foo} Title {.someclass #baz}
::: info {.myclass #foo section} Title {.someclass #baz span}
::: info {#foo section} Title {#baz span}
::: info {.myclass} Title {#baz}
::: info {#foo} Title {.someclass}
::: info {#foo} Title
::: info {#foo}
::: info {section#foo.myclass}
::: info Title {.someclass}
::: info Title {span#baz.someclass}
```

You should consider that **specific identifiers for `title` breaks the option `title: () => null`**, and the title will take place for that individual container.

## Syntax tree

This plugin only modifies the mdast (markdown abstract syntax tree) as explained.

## Types

This package is fully typed with [TypeScript][url-typescript]. The plugin options' type is exported as `FlexibleContainerOptions`.

## Compatibility

This plugin works with `unified` version 6+ and `remark` version 7+. It is compatible with `mdx` version 2+.

## Security

Use of `remark-flexible-containers` does not involve rehype (hast) or user content so there are no openings for cross-site scripting (XSS) attacks.

## My Plugins

I like to contribute the Unified / Remark / MDX ecosystem, so I recommend you to have a look my plugins.

### My Remark Plugins

- [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
- [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
- [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown
- [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
- [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
- [`remark-flexible-toc`](https://www.npmjs.com/package/remark-flexible-toc)
  – Remark plugin to expose the table of contents via `vfile.data` or via an option reference
- [`remark-mdx-remove-esm`](https://www.npmjs.com/package/remark-mdx-remove-esm)
  – Remark plugin to remove import and/or export statements (mdxjsEsm)

### My Rehype Plugins

- [`rehype-pre-language`](https://www.npmjs.com/package/rehype-pre-language)
  – Rehype plugin to add language information as a property to `pre` element
- [`rehype-highlight-code-lines`](https://www.npmjs.com/package/rehype-highlight-code-lines)
  – Rehype plugin to add line numbers to code blocks and allow highlighting of desired code lines
- [`rehype-code-meta`](https://www.npmjs.com/package/rehype-code-meta)
  – Rehype plugin to copy `code.data.meta` to `code.properties.metastring`
- [`rehype-image-toolkit`](https://www.npmjs.com/package/rehype-image-toolkit)
  – Rehype plugin to enhance Markdown image syntax `![]()` and Markdown/MDX media elements (`<img>`, `<audio>`, `<video>`) by auto-linking bracketed or parenthesized image URLs, wrapping them in `<figure>` with optional captions, unwrapping images/videos/audio from paragraph, parsing directives in title for styling and adding attributes, and dynamically converting images into `<video>` or `<audio>` elements based on file extension.

### My Recma Plugins

- [`recma-mdx-escape-missing-components`](https://www.npmjs.com/package/recma-mdx-escape-missing-components)
  – Recma plugin to set the default value `() => null` for the Components in MDX in case of missing or not provided so as not to throw an error
- [`recma-mdx-change-props`](https://www.npmjs.com/package/recma-mdx-change-props)
  – Recma plugin to change the `props` parameter into the `_props` in the `function _createMdxContent(props) {/* */}` in the compiled source in order to be able to use `{props.foo}` like expressions. It is useful for the `next-mdx-remote` or `next-mdx-remote-client` users in `nextjs` applications.
- [`recma-mdx-change-imports`](https://www.npmjs.com/package/recma-mdx-change-imports)
  – Recma plugin to convert import declarations for assets and media with relative links into variable declarations with string URLs, enabling direct asset URL resolution in compiled MDX.
- [`recma-mdx-import-media`](https://www.npmjs.com/package/recma-mdx-import-media)
  – Recma plugin to turn media relative paths into import declarations for both markdown and html syntax in MDX.
- [`recma-mdx-import-react`](https://www.npmjs.com/package/recma-mdx-import-react)
  – Recma plugin to ensure getting `React` instance from the arguments and to make the runtime props `{React, jsx, jsxs, jsxDev, Fragment}` is available in the dynamically imported components in the compiled source of MDX.
- [`recma-mdx-html-override`](https://www.npmjs.com/package/recma-mdx-html-override)
  – Recma plugin to allow selected raw HTML elements to be overridden via MDX components.
- [`recma-mdx-interpolate`](https://www.npmjs.com/package/recma-mdx-interpolate)
  – Recma plugin to enable interpolation of identifiers wrapped in curly braces within the `alt`, `src`, `href`, and `title` attributes of markdown link and image syntax in MDX.

## License

[MIT License](./LICENSE) © ipikuka

[unified]: https://github.com/unifiedjs/unified
[micromark]: https://github.com/micromark/micromark
[remark]: https://github.com/remarkjs/remark
[remarkplugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
[mdast]: https://github.com/syntax-tree/mdast

[badge-npm-version]: https://img.shields.io/npm/v/remark-flexible-containers
[badge-npm-download]:https://img.shields.io/npm/dt/remark-flexible-containers
[url-npm-package]: https://www.npmjs.com/package/remark-flexible-containers
[url-github-package]: https://github.com/ipikuka/remark-flexible-containers

[badge-license]: https://img.shields.io/github/license/ipikuka/remark-flexible-containers
[url-license]: https://github.com/ipikuka/remark-flexible-containers/blob/main/LICENSE

[badge-publish-to-npm]: https://github.com/ipikuka/remark-flexible-containers/actions/workflows/publish.yml/badge.svg
[url-publish-github-actions]: https://github.com/ipikuka/remark-flexible-containers/actions/workflows/publish.yml

[badge-typescript]: https://img.shields.io/npm/types/remark-flexible-containers
[url-typescript]: https://www.typescriptlang.org/

[badge-codecov]: https://codecov.io/gh/ipikuka/remark-flexible-containers/graph/badge.svg?token=XWTU29ESSO
[url-codecov]: https://codecov.io/gh/ipikuka/remark-flexible-containers

[badge-type-coverage]: https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fipikuka%2Fremark-flexible-containers%2Fmaster%2Fpackage.json
