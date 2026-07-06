/** @type {import('@bacons/apple-targets').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "CryptoWikiWidgets",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.shadev.thecryptowiki",
    ],
  },
});
