# ngx-firebase-ai-logic

Angular providers for **Firebase AI Logic** (Gemini) with **App Check** — one command to scaffold and bootstrap AI-powered apps.

Companion guide: [Firebase AI Logic in Angular: Client-Side Gemini Without a Custom Backend](https://dev.to/gde/firebase-ai-logic-in-angular-client-side-gemini-without-a-custom-backend-54eh).

## What it does

- **`ng add ngx-firebase-ai-logic`** — scaffolds environment files, `AiService`, optional demo component, wires `app.config.ts` and `index.html`
- Single **`provideFirebaseAILogic()`** call — Firebase App, App Check, and `getAI()` in the correct order
- **Eager App Check init** on startup — debug token appears in DevTools immediately
- **reCAPTCHA Enterprise** in production, **debug tokens** on localhost
- **SSR-safe** App Check placeholder
- **Limited-use App Check tokens** in production (replay protection)
- **Dev-only diagnostics** — App Check + Gemini probe (never runs in production builds)
- Uses the `firebase` JS SDK directly
- Typed injection tokens: **`FIREBASE_AI`**, **`FIREBASE_APP`**, **`FIREBASE_APP_CHECK`**

## Requirements

| Package | Version |
|---------|---------|
| `@angular/core` | >= 18 |
| `@angular/common` | >= 18 |
| `firebase` | >= 12.19.0 |

## Install & scaffold

```bash
ng add ngx-firebase-ai-logic
```

This installs `firebase`, creates the files below (skipping any that already exist), patches your app wiring, and prints what to fill in next.

| File | What you replace |
|------|------------------|
| `src/environments/firebase.config.ts` | `YOUR_API_KEY`, `YOUR_PROJECT_*`, reCAPTCHA site key |
| `src/app/services/ai.service.ts` | Gemini model ID (default: `gemini-3.5-flash`) |
| Firebase Console | AI Logic, App Check, API key restrictions — see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) |

### Generated files

```
src/environments/
  firebase.config.ts          ← paste Firebase + reCAPTCHA credentials
  environment.model.ts        ← typed with FirebaseAILogicEnvironment
  environment.ts              ← production
  environment.development.ts  ← dev + appCheckDebugToken
src/app/services/ai.service.ts
src/app/ai-demo/              ← optional demo (use --demo=false to skip)
```

Also patched automatically (idempotent — safe to re-run):

- `src/app/app.config.ts` — adds `provideFirebaseAILogic(firebaseAILogicFromEnvironment(environment))`
- `src/index.html` — localhost App Check debug script
- `angular.json` — `fileReplacements` for development builds (if missing)

### Options

```bash
# Skip demo component
ng add ngx-firebase-ai-logic --demo=false

# Custom default model in scaffolded AiService
ng add ngx-firebase-ai-logic --model=gemini-3.5-flash

# Re-run scaffold on an existing project (skips files that already exist)
ng generate ngx-firebase-ai-logic:setup

# Skip environment file generation if you manage those yourself
ng generate ngx-firebase-ai-logic:setup --skipEnvironments=true
```

## After `ng add`

1. **Firebase Console** — follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Replace placeholders** in `src/environments/firebase.config.ts`
3. **`ng serve`** → copy App Check debug token from DevTools → Firebase Console → Manage debug tokens
4. **Demo** — add `<app-ai-demo />` to your root template and import `AiDemo` in the parent component
5. Click **Ask Gemini** — text back with no 403 means setup works

## Manual setup (without schematics)

If you prefer not to use `ng add`:

```bash
npm install ngx-firebase-ai-logic firebase
```

```typescript
// app.config.ts
import {
  firebaseAILogicFromEnvironment,
  provideFirebaseAILogic,
} from 'ngx-firebase-ai-logic';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseAILogic(firebaseAILogicFromEnvironment(environment)),
  ],
};
```

```typescript
// ai.service.ts
import { inject, Injectable } from '@angular/core';
import { getGenerativeModel } from 'firebase/ai';
import { FIREBASE_AI } from 'ngx-firebase-ai-logic';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly ai = inject(FIREBASE_AI);

  async ask(prompt: string): Promise<string> {
    const model = getGenerativeModel(this.ai, { model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

See the [DEV article](https://dev.to/gde/firebase-ai-logic-in-angular-client-side-gemini-without-a-custom-backend-54eh) for the full manual walkthrough.

## Configuration reference

```typescript
provideFirebaseAILogic({
  firebaseConfig: { /* from Firebase Console */ },
  recaptchaEnterpriseSiteKey: '6L...',

  // Optional
  production: false,
  appCheckDebugToken: true,
  useLimitedUseAppCheckTokens: true,     // default: same as production
  enableDevDiagnostics: true,            // default: !production
  diagnosticsLabel: 'my-app',
  probeModel: 'gemini-3.1-flash-lite',
  backend: new GoogleAIBackend(),
});
```

## Public API

| Export | Description |
|--------|-------------|
| `provideFirebaseAILogic(config)` | Root providers for App + App Check + AI |
| `firebaseAILogicFromEnvironment(env)` | Map typed `environment` → config |
| `FirebaseAILogicEnvironment` | Type for `environment.model.ts` |
| `FIREBASE_AI` | Inject Gemini client |
| `FIREBASE_APP` | Inject `FirebaseApp` |
| `FIREBASE_APP_CHECK` | Inject `AppCheck` |
| `FIREBASE_AI_LOGIC_CONFIG` | Resolved config (advanced) |

## What stays in your app

This library handles **bootstrap and scaffolding**. You still own:

- Firebase Console configuration
- Business prompts, tool declarations, function calling
- Chat UI and product-specific services

See [ByteWise `ai.service.ts`](https://github.com/waynegakuo/bytewise/blob/main/src/app/services/ai.service.ts) for function calling.

## Development

```bash
git clone https://github.com/waynegakuo/ngx-firebase-ai-logic.git
cd ngx-firebase-ai-logic
npm install
npm run build
```

## License

MIT — see [LICENSE](./LICENSE).

## Links

- [Firebase AI Logic in Angular (DEV article)](https://dev.to/gde/firebase-ai-logic-in-angular-client-side-gemini-without-a-custom-backend-54eh)
- [Firebase AI Logic docs](https://firebase.google.com/docs/ai-logic)
- [App Check + AI Logic](https://firebase.google.com/docs/ai-logic/app-check)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
