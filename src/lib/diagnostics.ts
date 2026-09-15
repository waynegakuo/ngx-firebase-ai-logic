import { isPlatformBrowser } from '@angular/common';
import { isDevMode } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import { getToken, getLimitedUseToken, type AppCheck } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import type { ResolvedFirebaseAILogicConfig } from './config';

/**
 * Dev-only localhost report: App Check token + minimal Gemini probe.
 *
 * Skipped in production builds and when `enableDevDiagnostics` is `false`.
 */
export async function logFirebaseDevDiagnostics(
  firebaseApp: FirebaseApp,
  appCheck: AppCheck,
  platformId: object,
  config: ResolvedFirebaseAILogicConfig,
): Promise<void> {
  if (
    !isPlatformBrowser(platformId) ||
    config.production ||
    !config.enableDevDiagnostics ||
    !isDevMode()
  ) {
    return;
  }

  const label = config.diagnosticsLabel;
  const apiKey = config.firebaseConfig.apiKey ?? '(missing)';
  const maskedKey =
    apiKey.length > 8 ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}` : apiKey;

  console.group(`[${label}] Localhost diagnostics`);
  console.info('Project ID:', config.firebaseConfig.projectId);
  console.info('Web app ID:', config.firebaseConfig.appId);
  console.info('API key (masked):', maskedKey);
  console.info(
    'Limited-use App Check tokens:',
    config.useLimitedUseAppCheckTokens ? 'enabled' : 'disabled',
  );

  try {
    const { token } = await getToken(appCheck, false);
    console.info('App Check standard token: OK', `(${token.length} chars)`);
  } catch (error) {
    console.error('App Check standard token: FAILED', error);
  }

  if (config.useLimitedUseAppCheckTokens) {
    try {
      await getLimitedUseToken(appCheck);
      console.info('App Check limited-use token: OK');
    } catch (error) {
      console.error('App Check limited-use token: FAILED', error);
    }
  }

  await probeGeminiGenerateContent(firebaseApp, config);
  console.groupEnd();
}

async function probeGeminiGenerateContent(
  firebaseApp: FirebaseApp,
  config: ResolvedFirebaseAILogicConfig,
): Promise<void> {
  const label = config.diagnosticsLabel;

  const ai = getAI(firebaseApp, {
    backend: config.backend ?? new GoogleAIBackend(),
    useLimitedUseAppCheckTokens: false,
  });

  const aiService = ai as { appCheck?: AppCheck | null };
  if (!aiService.appCheck) {
    console.error(
      `[${label}] getAI() has no App Check attached — check provider order.`,
    );
    return;
  }

  console.info('getAI() App Check wiring: OK');

  try {
    const model = getGenerativeModel(ai, { model: config.probeModel });
    await model.generateContent('ping');
    console.info('Gemini generateContent probe: OK');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Gemini generateContent probe: FAILED', error);

    if (/caller does not have permission/i.test(detail)) {
      console.error(
        `[${label}] See FIREBASE_SETUP.md — run AI Logic → Get started and verify Browser API key restrictions.`,
      );
    }
  }
}
