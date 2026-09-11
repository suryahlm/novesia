const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

const DEBUG_SIGNING_CONFIG = `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const RELEASE_SIGNING_CONFIG = `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('NOVESIA_RELEASE_STORE_FILE')) {
                storeFile file(NOVESIA_RELEASE_STORE_FILE)
                storePassword NOVESIA_RELEASE_STORE_PASSWORD
                keyAlias NOVESIA_RELEASE_KEY_ALIAS
                keyPassword NOVESIA_RELEASE_KEY_PASSWORD
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }`;

const OLD_RELEASE_BLOCK_HEADER = `release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

const NEW_RELEASE_BLOCK_HEADER = `release {
            signingConfig signingConfigs.release`;

function withReleaseSigning(config) {
  config = withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('withReleaseSigning: cuma support build.gradle Groovy (bukan .kts)');
    }
    let contents = modConfig.modResults.contents;
    if (!contents.includes(DEBUG_SIGNING_CONFIG)) {
      throw new Error(
        'withReleaseSigning: template signingConfigs bawaan Expo gak cocok lagi'
      );
    }
    if (!contents.includes(OLD_RELEASE_BLOCK_HEADER)) {
      throw new Error(
        'withReleaseSigning: template release buildType bawaan Expo gak cocok lagi'
      );
    }
    contents = contents.replace(DEBUG_SIGNING_CONFIG, RELEASE_SIGNING_CONFIG);
    contents = contents.replace(OLD_RELEASE_BLOCK_HEADER, NEW_RELEASE_BLOCK_HEADER);
    modConfig.modResults.contents = contents;
    return modConfig;
  });

  config = withGradleProperties(config, (modConfig) => {
    const props = [
      { type: 'property', key: 'NOVESIA_RELEASE_STORE_FILE', value: '../../keystores/novesia-release.keystore' },
      { type: 'property', key: 'NOVESIA_RELEASE_STORE_PASSWORD', value: 'Kjkszpjn7000#' },
      { type: 'property', key: 'NOVESIA_RELEASE_KEY_ALIAS', value: 'novesia-release' },
      { type: 'property', key: 'NOVESIA_RELEASE_KEY_PASSWORD', value: 'Kjkszpjn7000#' },
      { type: 'property', key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'android.enableShrinkResourcesInReleaseBuilds', value: 'true' },
    ];
    for (const p of props) {
      const idx = modConfig.modResults.findIndex((item) => item.key === p.key);
      if (idx >= 0) {
        modConfig.modResults[idx] = p;
      } else {
        modConfig.modResults.push(p);
      }
    }
    return modConfig;
  });

  return config;
}

module.exports = withReleaseSigning;
