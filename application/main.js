if (require.main === module) {
  const Shopfish = require('./etc');

  Shopfish.ApplicationServer.getServer()
    .listen(Shopfish.argv.flags.port || 3000)
    .catch(e => {
      process.stderr.write(e.stack);
      process.exit(1);
    });
}
