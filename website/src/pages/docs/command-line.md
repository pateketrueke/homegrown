---
title: Command line
next:
  label: Add-ons &rangle; Extensions
  link: docs/extensions
$render: ~/src/lib/layouts/default.pug
---

Make sure you write a script like the shown below, e.g. `your-app/server.js`

```js
// require and create a Grown-container
const Grown = require('grown')();

// exports for external usage
const initServer = module.exports = () => {
  // create the web-server instance
  const server = new Grown();

  // return the server to be called later
  return server;
};

// e.g. `node ./your-app/server.js`
if (require.main === module) {
  initServer()
    .listen(Grown.argv.flags.port || 8080)
    .catch(e => {
      console.log('E_FATAL', e);
      process.exit(1);
    });
}
```

Run your server manually with `node your-app/server.js` or with `npm start`.

For the latter add the following script to your `package.json` file:

```json
{
  "scripts": {
    "start": "grown up"
  }
}
```

Try `npx grown --help` to get more usage info.

> Also, you can setup a `bin/grown` executable with the following content:
>
> ```bash
> #!/usr/bin/env node
> require('grown/cli.js');
> ```
>
> Test it out!
