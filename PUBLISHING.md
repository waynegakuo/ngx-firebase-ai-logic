# Publishing ngx-firebase-ai-logic to npm

The **root** `package.json` is `private: true` — never publish from the repo root. The publishable package is built into `dist/ngx-firebase-ai-logic/`.

## Prerequisites

1. [npm account](https://www.npmjs.com/signup)
2. Log in locally: `npm login`
3. Name **`ngx-firebase-ai-logic`** is reserved for this package (verify: `npm view ngx-firebase-ai-logic` → 404 before first publish)

## Dry run (recommended)

```powershell
npm run pack:lib
```

Inspect the tarball (`ngx-firebase-ai-logic-0.1.0.tgz`). Confirm it contains:

- `fesm2022/ngx-firebase-ai-logic.mjs`
- `index.d.ts`, `lib/*.d.ts`
- `README.md`, `LICENSE`, `FIREBASE_SETUP.md`
- `package.json` with correct `main`, `module`, `types`, `exports`

## Publish

```powershell
npm run publish:lib
```

This runs `ng-packagr` build, strips `private` from the dist manifest (`prepare-dist`), then publishes from `./dist/ngx-firebase-ai-logic`.

## Version bumps

1. Edit `version` in root `package.json` (ng-packagr copies it to dist on build)
2. `npm run publish:lib`

Follow [semver](https://semver.org/): `0.1.0` → `0.1.1` (fix), `0.2.0` (feature), `1.0.0` (stable API).

## After publish

Consumers install with:

```bash
npm install ngx-firebase-ai-logic firebase @angular/fire
```

Push git tags (optional):

```powershell
git tag v0.1.0
git push origin v0.1.0
```
