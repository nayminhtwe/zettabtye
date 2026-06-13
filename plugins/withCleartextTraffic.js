const {
  withAndroidManifest,
  AndroidConfig,
  withInfoPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

function withCleartextTraffic(config) {
  config = withAndroidManifest(config, (manifestConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
    application.$["android:usesCleartextTraffic"] = "true";
    application.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return manifestConfig;
  });

  config = withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const xmlDir = path.join(modConfig.modRequest.platformProjectRoot, "app/src/main/res/xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, "network_security_config.xml"), NETWORK_SECURITY_CONFIG);
      return modConfig;
    },
  ]);

  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.NSAppTransportSecurity = {
      ...(plistConfig.modResults.NSAppTransportSecurity ?? {}),
      NSAllowsArbitraryLoadsInMedia: true,
    };
    return plistConfig;
  });

  return config;
}

module.exports = withCleartextTraffic;
