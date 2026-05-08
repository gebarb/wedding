module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Auto-approve build scripts for specific packages that need them
      if (pkg.name === '@parcel/watcher' || 
          pkg.name === 'esbuild' || 
          pkg.name === 'sharp') {
        return {
          ...pkg,
          scripts: {
            ...pkg.scripts,
            install: pkg.scripts?.install || 'node-gyp rebuild',
            preinstall: pkg.scripts?.preinstall
          }
        };
      }
      return pkg;
    }
  }
};
