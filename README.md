# ngx-firebase-ai-logic

Angular providers for **Firebase AI Logic** (Gemini) with **App Check** — one function to bootstrap AI-powered apps without rewiring Firebase on every project.

Extracted from production patterns in [ByteWise](https://github.com/waynegakuo/bytewise).

## What it does

- Single **`provideFirebaseAILogic()`** call — Firebase App, App Check, and `getAI()` in the correct order
- **reCAPTCHA Enterprise** in production, **debug tokens** on localhost
- **SSR-safe** App Check placeholder
- **Limited-use App Check tokens** in production (replay protection)
- **Dev-only diagnostics** — App Check + Gemini probe (never runs in production builds)
- Typed injection tokens: **`FIREBASE_AI`**, **`FIREBASE_APP`**

## Requirements

| Package | Version |
|---------|---------|
| `@angular/core` | >= 18 |
| `@angular/fire` | >= 18 |
| `firebase` | >= 12.19.0 |

## Install

```bash
npm install ngx-firebase-ai-logic firebase @angular/fire
```

## Quick start

### 1. Firebase Console

Follow **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** — create project, enable AI Logic, App Check, API key restrictions.

### 2. Register providers

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideFirebaseAILogic } from 'ngx-firebase-ai-logic';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseAILogic({
      firebaseConfig: environment.firebaseConfig,
      recaptchaEnterpriseSiteKey: environment.recaptchaEnterpriseSiteKey,
      production: environment.production,
      appCheckDebugToken: environment.appCheckDebugToken, // dev only
    }),
  ],
};
```

### 3. Localhost debug token (optional script in index.html)

```html
<script>
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
</script>
```

Register the printed debug token in Firebase Console → App Check.

### 4. Use Gemini in a service

```typescript
import { inject, Injectable } from '@angular/core';
import { getGenerativeModel } from 'firebase/ai';
import { FIREBASE_AI } from 'ngx-firebase-ai-logic';

@Injectable({ providedIn: 'root' })
export class MyAiService {
  private readonly ai = inject(FIREBASE_AI);

  async ask(prompt: string): Promise<string> {
    const model = getGenerativeModel(this.ai, { model: 'gemini-3.8-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
```

## Configuration reference

```typescript
provideFirebaseAILogic({
  firebaseConfig: { /* from Firebase Console */ },
  recaptchaEnterpriseSiteKey: '6L...',

  // Optional
  production: false,
  appCheckDebugToken: true,              // localhost; omit in production
  useLimitedUseAppCheckTokens: true,     // default: same as production
  enableDevDiagnostics: true,            // default: !production
  diagnosticsLabel: 'my-app',            // console prefix
  probeModel: 'gemini-3.1-flash-lite',   // dev connectivity test
  backend: new GoogleAIBackend(),        // default; or AgentPlatformBackend
});
```

## Public API

| Export | Description |
|--------|-------------|
| `provideFirebaseAILogic(config)` | Root providers for App + App Check + AI |
| `FIREBASE_AI` | Inject Gemini client (`firebase/ai` `AI` type) |
| `FIREBASE_APP` | Inject `FirebaseApp` |
| `FIREBASE_AI_LOGIC_CONFIG` | Resolved config (advanced) |
| `FirebaseAILogicConfig` | Config interface |

## What stays in your app

This library handles **bootstrap only**. You still implement:

- Tool declarations and executors (function calling)
- Chat UI and business services
- System prompts and model choice

See [ByteWise `ai.service.ts`](https://github.com/waynegakuo/bytewise/blob/main/src/app/services/ai.service.ts) for a full function-calling example.

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

- [Firebase AI Logic docs](https://firebase.google.com/docs/ai-logic)
- [App Check + AI Logic](https://firebase.google.com/docs/ai-logic/app-check)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
