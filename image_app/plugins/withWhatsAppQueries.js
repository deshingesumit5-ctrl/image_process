const { withAndroidManifest } = require('@expo/config-plugins');

const WHATSAPP_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];

module.exports = function withWhatsAppQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest.queries)) {
      manifest.queries = [{}];
    } else if (!manifest.queries.length) {
      manifest.queries.push({});
    }
    const queryBlock = manifest.queries[0];
    if (!Array.isArray(queryBlock.package)) {
      queryBlock.package = [];
    }
    for (const pkg of WHATSAPP_PACKAGES) {
      const exists = queryBlock.package.some(
        (entry) => entry?.$?.['android:name'] === pkg
      );
      if (!exists) {
        queryBlock.package.push({ $: { 'android:name': pkg } });
      }
    }
    return cfg;
  });
};
