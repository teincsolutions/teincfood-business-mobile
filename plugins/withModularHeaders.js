const { withPodfile, withAppDelegate } = require('@expo/config-plugins');

function addUseModularHeaders(podfileContents) {
  if (podfileContents.includes('use_modular_headers!')) return podfileContents;
  return podfileContents.replace(
    /^platform :ios,.*$/m,
    (match) => `${match}\n\nuse_modular_headers!`
  );
}

function addRNFBPostInstallFix(podfileContents) {
  if (podfileContents.includes('# RNFB framework module fix')) return podfileContents;

  const fixSnippet = `
    # RNFB framework module fix
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['DEFINES_MODULE'] = 'NO'
        end
      end
    end
`;

  return podfileContents.replace(
    /(ccache_enabled\s*=>\s*ccache_enabled\?\(podfile_properties\)[^)]*\)\s*)\n(\s*)end/,
    `$1\n${fixSnippet}$2end`
  );
}

module.exports = function withModularHeaders(config) {
  config = withPodfile(config, (config) => {
    config.modResults.contents = addUseModularHeaders(config.modResults.contents);
    config.modResults.contents = addRNFBPostInstallFix(config.modResults.contents);
    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.contents.includes('FirebaseApp.configure()')) return config;
    config.modResults.contents = config.modResults.contents.replace(
      'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
      'FirebaseApp.configure()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)'
    );
    return config;
  });

  return config;
};
