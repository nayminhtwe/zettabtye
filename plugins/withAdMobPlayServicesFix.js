const { withProjectBuildGradle } = require("@expo/config-plugins");

const MARKER = "force 'com.google.android.gms:play-services-ads:24.3.0'";

const RESOLUTION_BLOCK = `
  // play-services-ads 25.x needs Kotlin 2.2; 24.3.x works with Expo 53
  configurations.configureEach {
    resolutionStrategy {
      force 'com.google.android.gms:play-services-ads:24.3.0'
    }
  }`;

function withAdMobPlayServicesFix(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== "groovy") {
      return gradleConfig;
    }

    if (gradleConfig.modResults.contents.includes(MARKER)) {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      /maven \{ url 'https:\/\/www\.jitpack\.io' \}\n  \}/,
      `maven { url 'https://www.jitpack.io' }\n  }${RESOLUTION_BLOCK}`,
    );

    return gradleConfig;
  });
}

module.exports = withAdMobPlayServicesFix;
