const { withMainApplication } = require("@expo/config-plugins");

const FLAG_LINE = "ReactFeatureFlags.enableKeyDownEvents = true";

function withRemoteKeyEvents(config) {
  return withMainApplication(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== "kt") {
      return gradleConfig;
    }

    let contents = gradleConfig.modResults.contents;
    if (contents.includes(FLAG_LINE)) {
      return gradleConfig;
    }

    if (!contents.includes("import com.facebook.react.config.ReactFeatureFlags")) {
      contents = contents.replace(
        "import com.facebook.react.PackageList",
        "import com.facebook.react.config.ReactFeatureFlags\nimport com.facebook.react.PackageList",
      );
    }

    contents = contents.replace(
      "SoLoader.init(this, OpenSourceMergedSoMapping)",
      `${FLAG_LINE}\n    SoLoader.init(this, OpenSourceMergedSoMapping)`,
    );

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
}

module.exports = withRemoteKeyEvents;
