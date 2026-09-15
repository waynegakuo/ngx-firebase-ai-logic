import { inject, makeEnvironmentProviders, PLATFORM_ID, type EnvironmentProviders, type Injector } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AppCheck, provideAppCheck } from '@angular/fire/app-check';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';
import { initializeFirebaseAppCheck } from './app-check';
import {
  type FirebaseAILogicConfig,
  resolveFirebaseAILogicConfig,
} from './config';
import { FIREBASE_AI, FIREBASE_AI_LOGIC_CONFIG, FIREBASE_APP } from './tokens';

/**
 * Registers Firebase App, App Check, and Firebase AI Logic in Angular's injector.
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
    provideFirebaseApp(() => firebaseApp),
    provideAppCheck((injector: Injector) =>
      initializeFirebaseAppCheck(
        firebaseApp,
        injector.get(PLATFORM_ID),
        resolved,
      ),
    ),
    { provide: FIREBASE_APP, useValue: firebaseApp },
    {
      provide: FIREBASE_AI,
      useFactory: (): AI => createFirebaseAI(firebaseApp, resolved),
      deps: [AppCheck],
    },
  ]);
}

/**
 * Builds the Gemini client after App Check is ready.
 *
 * @param firebaseApp - Shared Firebase app instance.
 * @param config - Resolved library configuration.
 */
function createFirebaseAI(
  firebaseApp: ReturnType<typeof initializeApp>,
  config: ReturnType<typeof resolveFirebaseAILogicConfig>,
): AI {
  inject(AppCheck);

  return getAI(firebaseApp, {
    backend: config.backend ?? new GoogleAIBackend(),
    useLimitedUseAppCheckTokens: config.useLimitedUseAppCheckTokens,
  });
}
