const { Plugin } = require('~/lib/shared');

class AdminPlugin extends Plugin {
  async onAdmin(ctx, site) {
    const { render } = await ctx.bundle('admin/views/panel');

    return ctx.render('admin/views/layout', {
      body: render({
        plugins: this.siteManager.all,
        current: site.id,
      }),
      pkg: this.pkg,
      env: process.env,
      base: `/${site.id}/`,
      scripts: `<script src="/assets/${site.id}.js"></script>`,
      styles: `<link rel="stylesheet" href="/assets/${site.id}.css" />`,
    });
  }

  routeMappings(map) {
    const routes = map()
      .get('/api/status', ({ req, res }) => {
        res.write(JSON.stringify(req.headers, null, 2));
        res.status(200);
      });

    this.siteManager.all.forEach(site => {
      routes.get(`/${site.id}`, ctx => this.onAdmin(ctx, site));
      routes.get(`/${site.id}/*path`, ctx => this.onAdmin(ctx, site));
    });

    return routes;
  }
}

module.exports = (Shopfish, config) => {
  const siteManager = Shopfish.ApplicationServer.getSites();
  const pluginInstance = new AdminPlugin(Shopfish, {
    enabled: config.admin,
    name: 'adminPlugin',
    pkg: Shopfish.pkg,
    siteManager,
  });

  return pluginInstance;
};
