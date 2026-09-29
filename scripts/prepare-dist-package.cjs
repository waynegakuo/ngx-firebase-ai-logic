/**
 * ng-packagr copies root package.json fields (including `private`) into dist.
 * Strip `private`, copy schematics, and set publish metadata.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist', 'ngx-firebase-ai-logic');
const pkgPath = path.join(distDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

delete pkg.private;

pkg.schematics = './schematics/collection.json';
pkg['ng-add'] = {
  save: 'dependencies',
  packages: ['firebase@^12.19.0'],
};
pkg.dependencies = {
  '@angular-devkit/schematics': '^19.2.0',
  '@schematics/angular': '^19.2.0',
};

copyDir(path.join(rootDir, 'schematics'), path.join(distDir, 'schematics'));

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('Prepared dist/ngx-firebase-ai-logic/package.json for publish.');

/**
 * @param {string} src
 * @param {string} dest
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
