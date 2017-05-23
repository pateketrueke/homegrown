# Grown

[![travis-ci](https://api.travis-ci.org/pateketrueke/grown.svg)](https://travis-ci.org/pateketrueke/grown) [![codecov](https://codecov.io/gh/pateketrueke/grown/branch/master/graph/badge.svg)](https://codecov.io/gh/pateketrueke/grown)

Experimental DSL for web applications

```bash
$ yarn global add grown # or `npm i -g grown`
```

Quick example:

```bash
$ mkdir example
$ cd example
$ grown new .
```

Start the application in `development`:

```bash
$ yarn watch # or `npm run watch`
```

### More settings

Run `grown new -y` to start a new project interactively.

Also, you can specify each preset manually on the command line, e.g.

```bash
$ grown new . ES6=traceur BUNDLER=rollup STYLES=less DATABASE=sqlite
```

### Known issues

- `Cannot find module 'talavera'`

  Run `yarn` or `npm i` without arguments again, it will try to reinstall `talavera` for you.


## 1.0 - Overview

**Grown** is a _homegrown_ nodejs framework built on top of open-source technology,
it reuse many patterns from other frameworks and rely on terrific third-party libraries.

In a glance it resembles a well-known directory structure:

```bash
$ tree example
example
├── app
│   ├── server.js
│   ├── assets
│   │   ├── images
│   │   │   └── favicon.ico
│   │   ├── javascripts
│   │   │   └── application.js
│   │   └── stylesheets
│   │       └── application.css
│   ├── controllers
│   │   └── Home.js
│   ├── models
│   │   └── Dummy.js
│   └── views
│       └── layouts
│           └── default.js
├── bin
│   └── server
├── boot
│   ├── initializers
│   │   └── globals.js
│   └── middlewares
│       ├── body-parsers.js
│       ├── csrf-protection.js
│       ├── method-override.js
│       └── no-cache.js
├── build
├── config
│   ├── database.js
│   ├── middlewares.js
│   └── routes.js
├── lib
│   └── tasks
├── log
├── package.json
├── public
│   └── robots.txt
└── tmp
```

### 1.1 - Interactive mode

Execute `grown repl` to start an interactive session.

You can explore the available actions typing `.help` and hitting ENTER.

Most actions responds to the same syntax `arg1 arg2 ... -pq x=y a:b` where:

- `argN` are regular values (can be quoted)
- `-pq` are **flag** values (short or long, as CLI does)
- `x=y` are **data** values (can be quoted, e.g. `x="foo bar"`)
- `a:b` are **param** values (can be quoted, e.g. `a:"foo bar"`)

Try with `.render layouts/default csrf_token="oh noes" yield=OSOM` and see the results.

> Save/load different REPL sessions using the `-i` flag, e.g. `grown repl -i debug`

### 1.2 - Controllers

Routes are the way to go, then you can take control.

#### Routing

Route mappings are defined in the `config/routes.js` file:

```js
module.exports = map =>
  map()
    .get('/', 'Home#index', { as: 'root' });
```

Each time you call a `map()` factory you can pass values and they will be inherited down.

#### Definition

Controllers can be plain-old javascript objects.

```js
// app/controllers/Home.js

module.exports = {
  methods: {
    index() {}
  },
};
```
By the mere fact of being declared, the render plug will try to render a `Home/index` view.

#### End responses

Any method receives the connection object, in turn it can responds or return a string,
buffer, stream or promise:

```js
index(conn) {
  conn.resp_body = '42';
  // return '42';
  // return new Buffer('42');
  // return Promise.resolve('42');
  // return conn.end('42').then(...);
}
```

Call `put_status()` to set a proper status code:

```js
conn.put_status(400);
conn.resp_body = {
  status: 'error',
  message: 'Invalid input',
};
```

#### Testing actions

Doing assertions on your controllers' responses is easy peasy.

```coffee
# spec/pages-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'web pages', ->
  beforeEach Grown.test(app)

  it 'not all pages exists', (done) ->
    @server.fetch('/x').then (resp) ->
      expect(resp.body).toContain('Not Found')
      done()

  it 'but the homepage yes!', (done) ->
    @server.fetch('/').then (resp) ->
      expect(resp.body).toContain('It works!')
      done()
```

Run your tests with `yarn spec` or `npm run spec` and see the results.

#### Interactive mode

On the REPL you can `.fetch` resources too.

Examples:

```bash
.fetch POST /account --json username=foo
.fetch destroyAccount
.fetch showLogin
.fetch ...
```

To list all available routes just type `.routes` and hit ENTER.

Try `.routes <something>` to filter out matching routes.

### 1.3 - Models

Simple and well-known data structures that just works.

#### JSON-Schema

At least declaring a `$schema` will be enough.

```js
// app/models/Dummy.js

module.exports = {
  $schema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    required: [
      'id',
    ],
  },
},
```

Add more props according the [Sequelize models](http://docs.sequelizejs.com/), e.g.

```js
module.exports = {
  $schema: { ... },
  hooks: { ... },
  scope: { ... },
  ...
}
```

#### Model syncing

To synchronize your database execute `grown db-sync` on your terminal.

#### Testing models

Prove your models without any trouble:

```coffee
# spec/models-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all models', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    @models.Dummy.findAll().then (result) ->
      expect(result.length).toEqual 0
      done()
```

#### Interactive mode

Within the REPL you can run `.models` to inspect them.

Models are available within the REPL, so `Dummy` will be a local.

### 1.4 - Views

Responses are in their most beauty.

#### Functions as templates

Views are plain-old functions that receive data:

```js
// app/views/layouts/default.js

module.exports = locals => `<html>
  <head>
    <title>${locals.pageTiele || 'Untitled'}</title>
  </head>
  <body>${locals.yield}</body>
</html>`;
```

Values to render are mostly strings but they can be buffers or streams:

```js
const fs = require('fs');

module.exports = locals =>
  fs.createReadStream(locals.filePath);

// or
module.exports = locals => new Buffer('42');
```

Regular objects are rendered as JSON responses:

```js
module.exports = locals => ({
  status: 'ok',
  data: locals.userInput,
});
```

Promised values are resolved before they get finally rendered.

#### Pre-compiled templates

How this can be possible may you think?

Support for turning JSX, Pug, EJS, Handlebars, etc. into views is built-in:

```pug
//- app/views/layouts/default.js.pug

html
  head
    title= pageTitle || 'Untitled'
  body
    != yield
```

In the case of JSX you must pass a second argument for the `h()` helper:

```jsx
// app/views/layouts/default.jsx

module.exports = ({ pageTitle, yield }, h) => <html>
  <head>
    <title>${pageTiele || 'Untitled'}</title>
  </head>
  <body>${yield}</body>
</html>;
```

#### Layout and blocks

This can be changed through `locals`, `conn.layout` or from any controller:

```js
// app/controllers/Home.js

module.exports = {
  layout: 'website',
  methods: {
    index(conn) {
      // conn.layout = false;
      // conn.put_local('layout', false);
      // return conn.render('pages/welcome', { layout: false });
    },
  },
};
```

Also you can set `layout` functions to render:

```js
{
  layout: (locals, h) => (
    locals.isDebug
      ? h('pre', null, JSON.stringify(locals, null, 2))
      : locals.yield
  ),
}
```

Lazy-views are created the same way as regular views and render functions:

```js
conn.view('pages/first-chunk', { as: 'main' });
conn.view('pages/second-chunk', { as: 'sidebar' });
conn.view('pages/third-and-last', { as: 'sidebar' });
```

Chunks are grouped by using the same `as` local, once rendered they are arrays:

```js
locals => `<div>
  <aside>${locals.sidebar.join('\n')}</aside>
  <main>${locals.main}</main>
</div>`;
```

Wisely use `Array.isArray()` to check your locals for avoiding unexpected results.

#### Testing views

Render, validate and assert all kind-of views:

```coffee
# spec/views-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all views', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    data =
      value: 'OSOM'

    partial = @render (locals, h) ->
      h('p', null, locals.value)
    , data

    @render 'layouts/default',
      yield: partial
      routes: @routes

    .then (result) ->
      expect(result).toContain '<!doctype html>'
      expect(result).toContain '<p>OSOM</p>'
      done()
```

#### Interactive mode

The `.render` command help you to achieve similar results.

Examples:

```bash
.render layouts/default
.render Home/index
```

Locals declared on `before_send()` filters are not available on the REPL or `@render` method.

## 2.0 - Booting

### Server

### Plugins

### Initializers

### Middlewares

### Testing the app

### Interactive mode

## 3.0 - Asset pipeline

### Stylesheets

### Javascripts

### Static files

### Images
