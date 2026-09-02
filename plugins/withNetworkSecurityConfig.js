const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to permanently allow HTTP (cleartext) traffic 
 * by adding network_security_config.xml and linking it in AndroidManifest.xml.
 */
const withNetworkSecurityConfig = (config) => {
  // 1. Link to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    
    // Ensure android:networkSecurityConfig is set
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    
    return config;
  });

  // 2. Create the actual XML file
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      const xmlDir = path.join(resDir, 'xml');
      const filePath = path.join(xmlDir, 'network_security_config.xml');

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }
      fs.writeFileSync(filePath, xmlContent);
      console.log(`[withNetworkSecurityConfig] Created ${filePath}`);
      
      return config;
    },
  ]);

  return config;
};

module.exports = withNetworkSecurityConfig;
