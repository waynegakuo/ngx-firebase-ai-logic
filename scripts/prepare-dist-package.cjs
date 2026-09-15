/**
 * ng-packagr copies root package.json fields (including `private`) into dist.
 * Strip `private` so npm publish accepts the built package.
 */
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'dist', 'ngx-firebase-ai-logic', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

delete pkg.private;

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('Prepared dist/ngx-firebase-ai-logic/package.json for publish.');
