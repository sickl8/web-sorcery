# web-sorcery

[![alt Support Me on Ko-Fi](/public/kofi_button_red.png)](https://ko-fi.com/sickl8)

This is a fork of [Rich Harris' npm package sorcery](https://www.npmjs.com/package/sorcery) that is intended to work in a browser environment, it's dependencies are optimized and it's ported to typescript for full typing support.

Sourcemaps are great - if you have a JavaScript file, and you minify it, your minifier can generate a map that lets you debug as though you were looking at the original uncompressed code.

But if you have more than one transformation - say you want to transpile your JavaScript, concatenate several files into one, and minify the result - it gets a little trickier. Each intermediate step needs to be able to both _ingest_ a sourcemap and _generate_ one, all the time pointing back to the original source.

Most compilers don't do that. ([UglifyJS](https://github.com/mishoo/UglifyJS2) is an honourable exception.) So when you fire up devtools, instead of looking at the original source you find yourself looking at the final intermediate step in the chain of transformations.

**web-sorcery aims to fix that.** Given a file at the end of a transformation chain (e.g., your minified JavaScript), it will follow the entire chain back to the original source, and generate a new sourcemap that describes the whole process. How? Magic.

This is a work-in-progress - suitable for playing around with, but don't rely on it to debug air traffic control software or medical equipment. Other than that, it can't do much harm.

## Usage

### As a node module

Install web-sorcery locally:

```bash
npm install web-sorcery
```

```js
import * as sorcery from 'web-sorcery';

sorcery.load('some/generated/code.min.js').then(function (chain) {
  // generate a flattened sourcemap
  var map = chain.apply(); // { version: 3, file: 'code.min.js', ... }

  // get a JSON representation of the sourcemap
  map.toString(); // '{"version":3,"file":"code.min.js",...}'

  // get a data URI representation
  map.toUrl(); // 'data:application/json;charset=utf-8;base64,eyJ2ZXJ...'

  // find the origin of line x, column y. Returns an object with
  // `source`, `line`, `column` and (if applicable) `name` properties.
  // Note - for consistency with other tools, line numbers are always
  // one-based, column numbers are always zero-based. It's daft, I know.
  var loc = chain.trace(x, y);
});

// You can also use sorcery synchronously:
var chain = sorcery.loadSync('some/generated/code.min.js');
var map = chain.apply();
var loc = chain.trace(x, y);
chain.writeSync();
```

#### Advanced options

You can pass an optional second argument to `sorcery.load()` and `sorcery.loadSync()`, with zero or more of the following properties:

- `content` - a map of `filename: contents` pairs. `filename` will be resolved against the current working directory if needs be
- `sourcemaps` - a map of `filename: sourcemap` pairs, where `filename` is the name of the file the sourcemap is related to. This will override any `sourceMappingURL` comments in the file itself.

For example:

```js
sorcery.load( 'some/generated/code.min.js', {
  content: {
    'some/minified/code.min.js': '...',
    'some/transpiled/code.js': '...',
    'some/original/code.js': '...'
  },
  sourcemaps: {
    'some/minified/code.min.js': {...},
    'some/transpiled/code.js': {...}
  }
}).then( chain => {
  /* ... */
});
```

## License

MIT
