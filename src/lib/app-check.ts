import { isPlatformBrowser } from '@angular/common';
import type { FirebaseApp } from '@angular/fire/app';
import {
  CustomProvider,
  getToken,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';
import type { ResolvedFirebaseAILogicConfig } from './config';
import { logFirebaseDevDiagnostics } from './diagnostics';

interface AppCheckDebugGlobal {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
}

/**
 * Enables the App Check debug provider before `initializeAppCheck()`.
 *
 * @param isBrowser - `false` during SSR.
 * @param config - Resolved library configuration.
 */
export function enableAppCheckDebugToken(
  isBrowser: boolean,
  config: ResolvedFirebaseAILogicConfig,
): void {
  if (!isBrowser || config.production) {
    return;
  }

  const debugToken = config.appCheckDebugToken ?? true;
  if (debugToken === false) {
    return;
  }

  (globalThis as typeof globalThis & AppCheckDebugGlobal)
    .FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

/**
 * Initializes Firebase App Check for browser, localhost debug, or SSR.
 *
 * @param firebaseApp - Same app instance passed to `getAI()`.
 * @param platformId - Angular `PLATFORM_ID`.
 * @param config - Resolved library configuration.
 */
export function initializeFirebaseAppCheck(
  firebaseApp: FirebaseApp,
  platformId: object,
  config: ResolvedFirebaseAILogicConfig,
): AppCheck {
  const isBrowser = isPlatformBrowser(platformId);
  const label = config.diagnosticsLabel;

  enableAppCheckDebugToken(isBrowser, config);

  if (!isBrowser) {
    return initializeAppCheck(firebaseApp, {
      provider: new CustomProvider({
        getToken: async () => ({
          token: 'ssr-placeholder',
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        }),
      }),
      isTokenAutoRefreshEnabled: false,
    });
  }

  const usingDebugProvider =
    !config.production &&
    config.appCheckDebugToken !== false &&
    (globalThis as typeof globalThis & AppCheckDebugGlobal)
      .FIREBASE_APPCHECK_DEBUG_TOKEN !== undefined;

  const appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(config.recaptchaEnterpriseSiteKey),
    isTokenAutoRefreshEnabled: true,
  });

  if (usingDebugProvider && config.enableDevDiagnostics) {
    logAppCheckDebugInstructions(label);
    void verifyAppCheckToken(appCheck, label).then(() =>
      logFirebaseDevDiagnostics(firebaseApp, appCheck, platformId, config),
    );
  }

  return appCheck;
}

async function verifyAppCheckToken(
  appCheck: AppCheck,
  label: string,
): Promise<void> {
  try {
    const { token } = await getToken(appCheck, false);
    console.info(
      `[${label}] App Check token OK (${token.length} chars).`,
    );
  } catch (error) {
    console.error(`[${label}] App Check token fetch failed:`, error);
  }
}

function logAppCheckDebugInstructions(label: string): void {
  console.info(
    [
      `[${label}] App Check debug mode is active (localhost).`,
      '1. In DevTools → Console, find: AppCheck debug token: "..."',
      '2. Firebase Console → App Check → your web app → Manage debug tokens → Add token.',
      '3. Hard-refresh (Ctrl+Shift+R), then retry your AI request.',
    ].join('\n'),
  );
}
