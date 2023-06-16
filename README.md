# remark-flexible-containers

[![NPM version][npm-image]][npm-url]
[![Build][github-build]][github-build-url]
![npm-typescript]
[![License][github-license]][github-license-url]

This package is a [unified][unified] ([remark][remark]) plugin to add custom containers in a flexible way (compatible with new parser "[micromark][micromark]").

"**unified**" is a project that transforms content with abstract syntax trees (ASTs). "**remark**" adds support for markdown to unified. "**mdast**" is the markdown abstract syntax tree (AST) that remark uses.

**This plugin is a remark plugin that transforms the mdast.**

## When should I use this?

This plugin is useful if you want to **add a custom container** in markdown, for example, in order to produce a **callout** or **admonition**.

- This plugin can add `container` node, with _custom tag name, custom class name and also additional properties_.
- This plugin can add `title` node inside the container, if the title is provided, with _custom tag name, custom class name and also additional properties_.

This plugin does not support nested containers.

## Installation

This package is suitable for ESM only. In Node.js (version 14.14+, 16.0+), install with npm:

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

**You don't need to put empty lines inside the container.** But, _there must be empty lines before and after the container in order to parse the markdown properly._

```markdown
<!--- here must be empty line --->
::: warning title
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
(The type is also added as a class name into the container)

```html
<div class="remark-container warning">
  <div class="remark-container-title">title</div>
  <p>My paragraph with <strong>bold text</strong></p>
</div>
```

Without `remark-flexible-containers`, you’d get:

```html
<p>::: warning title
My paragraph with <strong>bold text</strong>
:::</p>
```

## Options

All options are optional and have default values.

```javascript
use(remarkFlexibleContainers, {
  containerTagName: string, // optional, default is "div"
  containerClassName: string, // optional, default is "remark-container"
  containerProperties: (type?: string, title?: string) => Record<string, unknown>, // optional, default is undefined
  title: null | undefined, // optional, default is undefined
  titleTagName: string, // optional, default is "div"
  titleClassName: string, // optional, default is "remark-container-title"
  titleProperties: (type?: string, title?: string) => Record<string, unknown>, // optional, default is undefined
})
```

#### `containerTagName`

It is a **string** option for providing custom HTML tag name for the `container` node other than `div`.

#### `containerClassName`

It is a **string** option for providing custom className for the `container` node other than `remark-container`.

#### `containerProperties`

It is an option to set additional properties for the `container` node. It is a callback function that takes the `type` and the `title` as optional arguments and returns the object which is going to be used for adding additional properties into the `container` node.

#### `title`

It is a **null | undefined** option for not adding any `title` node. If the option is provided as `null`, the plugin will not add the `title` node. Default is `undefined`, which adds a `title` node if a title is provided.

#### `titleTagName`

It is a **string** option for providing custom HTML tag name for the `title` node other than `div`.

#### `titleClassName`

It is a **string** option for providing custom className for the `title` node other than `remark-container-title` .

#### `titleProperties`

It is an option to set additional properties for the `title` node. It is a callback function that takes the `type` and the `title` as optional arguments and returns the object which is going to be used for adding additional properties into the `title` node.

## Examples:

```markdown
::: info My Title
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
  <div class="remark-container-title">My Title</div>
  <p>Some information</p>
</div>
```

#### With the title option is `null`

```javascript
use(remarkFlexibleContainers, {
  title: null,
});
```

is going to produce the container without title (even if the the title is provided in markdown):

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
      title,
    };
  },
  titleTagName: "span",
  titleClassName: "remark-custom-wrapper-title",
  titleProperties: (type, title) => {
      ["data-type"]: type,
  },
});
```

is going to produce the container `section` element like below:

```html
<section class="remark-custom-wrapper info" data-type="info" title="My Title">
  <span class="remark-custom-wrapper-title" data-type="info">My Title</span>
  <p>Some information</p>
</section>
```

#### Without a type and a title

You can use the plugin syntax without providing a type and a title

```markdown
:::
Some information
:::
```

It will not add a `title` node since it is not provided, and it will also not add the type as a classname into the container:

```html
<div class="remark-container">
  <p>Some information</p>
</div>
```

**The flexible container can contain also html elements and mdx components:**

```markdown
::: danger My Title
My name is **talatkuyuk** AKA ipikuka
this package is _so cool and flexible_

::it does not confuse with double colons::

<mark>marked text</mark>
<MarkRed>custom marker</MarkRed>

<details>
  <summary>HTML tag works too</summary>
  <p>I am working</p>
</details>
  
other paragraph *italic content* and,
some **bold content** without stress
:::
```

## Syntax tree

This plugin only modifies the mdast (markdown abstract syntax tree) as explained.

## Types

This package is fully typed with [TypeScript][typeScript]. The plugin options' type is exported as `FlexibleContainerOptions`.

## Compatibility

This plugin works with unified version 6+ and remark version 7+. It is compatible with mdx version 2.

## Security

Use of `remark-flexible-containers` does not involve rehype (hast) or user content so there are no openings for cross-site scripting (XSS) attacks.

## My Remark Plugins

The remark packages I have published are presented below:
+ [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
+ [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
+ [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
+ [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
+ [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown

## License

[MIT][license] © ipikuka

### Keywords

[unified][unifiednpm] [remark][remarknpm] [remark-plugin][remarkpluginnpm] [mdast][mdastnpm] [markdown][markdownnpm] [remark custom container][remarkCustomContainersnpm]

[unified]: https://github.com/unifiedjs/unified
[unifiednpm]: https://www.npmjs.com/search?q=keywords:unified
[remark]: https://github.com/remarkjs/remark
[remarknpm]: https://www.npmjs.com/search?q=keywords:remark
[remarkpluginnpm]: https://www.npmjs.com/search?q=keywords:remark%20plugin
[mdast]: https://github.com/syntax-tree/mdast
[mdastnpm]: https://www.npmjs.com/search?q=keywords:mdast
[micromark]: https://github.com/micromark/micromark
[rehypeprismplus]: https://github.com/timlrx/rehype-prism-plus
[typescript]: https://www.typescriptlang.org/
[license]: https://github.com/ipikuka/remark-flexible-containers/blob/main/LICENSE
[markdownnpm]: https://www.npmjs.com/search?q=keywords:markdown
[remarkCustomContainersnpm]: https://www.npmjs.com/search?q=keywords:remark%20custom%20container
[npm-url]: https://www.npmjs.com/package/remark-flexible-containers
[npm-image]: https://img.shields.io/npm/v/remark-flexible-containers
[github-license]: https://img.shields.io/github/license/ipikuka/remark-flexible-containers
[github-license-url]: https://github.com/ipikuka/remark-flexible-containers/blob/master/LICENSE
[github-build]: https://github.com/ipikuka/remark-flexible-containers/actions/workflows/publish.yml/badge.svg
[github-build-url]: https://github.com/ipikuka/remark-flexible-containers/actions/workflows/publish.yml
[npm-typescript]: https://img.shields.io/npm/types/remark-flexible-containers
