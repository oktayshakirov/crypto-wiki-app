// react-native-google-mobile-ads ships its own AndroidManifest.xml with
// placeholder values for these two meta-data entries. Our manifest sets the
// real ones, and without tools:replace the merger treats that as a genuine
// conflict rather than an override - so :app:processDebugMainManifest (and
// the release equivalent) fails outright with "is also present at
// [:react-native-google-mobile-ads] AndroidManifest.xml ... value=()".
//
// This used to be a hand-edit in android/app/src/main/AndroidManifest.xml,
// which `expo prebuild --clean` deletes every time it regenerates that file.
// A config plugin survives prebuild; a hand-edit does not.
const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

const REPLACED_META_DATA = [
  "com.google.android.gms.ads.APPLICATION_ID",
  "com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT",
];

module.exports = function withAdMobManifestReplace(config) {
  return withAndroidManifest(config, (cfg) => {
    // The generated manifest's root <manifest> only declares xmlns:android -
    // tools:replace is meaningless (and invalid XML) without xmlns:tools too.
    const manifest = cfg.modResults.manifest;
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults
    );
    app["meta-data"] = app["meta-data"] || [];

    for (const name of REPLACED_META_DATA) {
      const item = app["meta-data"].find((m) => m.$["android:name"] === name);
      if (item) {
        item.$["tools:replace"] = "android:value";
      }
    }

    return cfg;
  });
};
