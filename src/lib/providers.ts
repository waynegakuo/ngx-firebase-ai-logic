import {
  inject,
  makeEnvironmentProviders,
  PLATFORM_ID,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';
import { initializeApp } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';
import { initializeFirebaseAppCheck } from './app-check';
import {
  type FirebaseAILogicConfig,
  resolveFirebaseAILogicConfig,
} from './config';
import {
  FIREBASE_AI,
  FIREBASE_AI_LOGIC_CONFIG,
  FIREBASE_APP,
  FIREBASE_APP_CHECK,
} from './tokens';

/**
 * Registers Firebase App, App Check, and Firebase AI Logic in Angular's injector.
 *
 * Uses the `firebase` JS SDK directly (no `@angular/fire` dependency) so the
 * library works with any supported Angular version without AngularFire peer conflicts.
 *
 * Call once from `appConfig.providers`. Downstream services inject
 * {@link FIREBASE_AI} to call Gemini — never call `getAI()` directly.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideFirebaseAILogic } from 'ngx-firebase-ai-logic';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFirebaseAILogic({
 *       firebaseConfig: environment.firebaseConfig,
 *       recaptchaEnterpriseSiteKey: environment.recaptchaEnterpriseSiteKey,
 *       production: environment.production,
 *       appCheckDebugToken: environment.appCheckDebugToken,
 *     }),
 *   ],
 * };
 * ```
 *
 * @param config - Firebase credentials and App Check options.
 * @returns Environment providers for the root injector.
 *
 * @see https://firebase.google.com/docs/ai-logic/app-check
 */
export function provideFirebaseAILogic(
  config: FirebaseAILogicConfig,
): EnvironmentProviders {
  const resolved = resolveFirebaseAILogicConfig(config);
  const firebaseApp = initializeApp(resolved.firebaseConfig);

  return makeEnvironmentProviders([
    { provide: FIREBASE_AI_LOGIC_CONFIG, useValue: resolved },
    { provide: FIREBASE_APP, useValue: firebaseApp },
    {
      provide: FIREBASE_APP_CHECK,
      useFactory: (platformId: object) =>
        initializeFirebaseAppCheck(firebaseApp, platformId, resolved),
      deps: [PLATFORM_ID],
    },
    {
      provide: FIREBASE_AI,
      useFactory: (_appCheck: AppCheck): AI =>
        getAI(firebaseApp, {
          backend: resolved.backend ?? new GoogleAIBackend(),
          useLimitedUseAppCheckTokens: resolved.useLimitedUseAppCheckTokens,
        }),
      deps: [FIREBASE_APP_CHECK],
    },
    // Eager-init App Check on startup — prints the debug token in DevTools
    // immediately so you can register it in Firebase Console before first use.
    provideAppInitializer(() => {
      inject(FIREBASE_APP_CHECK);
    }),
  ]);
}
