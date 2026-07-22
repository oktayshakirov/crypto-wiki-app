// Keeps the portrait lock on large screens. Apps targeting API 36 have their
// orientation, aspect ratio and resizability restrictions ignored on displays
// with sw >= 600dp (tablets, unfolded foldables) unless this property is set.
// Google removes the opt-out at API 37, so the layouts need to go adaptive
// before that bump.
const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

const PROPERTY_NAME =
  "android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY";

module.exports = function withRestrictedResizability(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults
    );
    app.property = app.property || [];

    let item = app.property.find((p) => p.$["android:name"] === PROPERTY_NAME);
    if (!item) {
      item = { $: { "android:name": PROPERTY_NAME } };
      app.property.push(item);
    }
    item.$["android:value"] = "true";

    return cfg;
  });
};
