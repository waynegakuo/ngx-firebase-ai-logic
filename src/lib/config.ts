import type { FirebaseOptions } from 'firebase/app';
import type { Backend } from 'firebase/ai';

/**
 * Configuration passed to {@link provideFirebaseAILogic}.
 *
 * Keeps Firebase credentials and App Check options in one object so apps do
 * not need a custom environment interface for the library to work.
 */
export interface FirebaseAILogicConfig {
  /** Firebase web app credentials from the Firebase Console. */
  firebaseConfig: FirebaseOptions;

  /**
   * Score-based reCAPTCHA Enterprise site key for App Check on web.
   * Must match the key registered on your Firebase web app in the Console.
   */
  recaptchaEnterpriseSiteKey: string;

  /**
   * When `true`, skips App Check debug mode and enables limited-use tokens
   * (unless overridden). Defaults to `false`.
   */
  production?: boolean;

  /**
   * Local development only. `true` enables the App Check debug provider;
   * a UUID string reuses an already-registered token.
   * Ignored when `production` is `true`.
   */
  appCheckDebugToken?: boolean | string;

  /**
   * One-time App Check tokens per Gemini request (replay protection).
   * Defaults to `production` value when omitted.
   */
  useLimitedUseAppCheckTokens?: boolean;

  /**
   * Runs localhost diagnostics (App Check + Gemini probe) after init.
   * Defaults to `true` when not in production.
   */
  enableDevDiagnostics?: boolean;

  /** Console log prefix for diagnostics. Defaults to `ngx-firebase-ai-logic`. */
  diagnosticsLabel?: string;

  /**
   * Gemini backend. Defaults to {@link GoogleAIBackend} (Gemini Developer API).
   * Use {@link AgentPlatformBackend} for Vertex / Agent Platform instead.
   */
  backend?: Backend;

  /** Model ID for the dev connectivity probe. Defaults to `gemini-3.1-flash-lite`. */
  probeModel?: string;
}

/** Resolved config with defaults applied inside the library. */
export interface ResolvedFirebaseAILogicConfig extends FirebaseAILogicConfig {
  production: boolean;
  useLimitedUseAppCheckTokens: boolean;
  enableDevDiagnostics: boolean;
  diagnosticsLabel: string;
  probeModel: string;
}

/**
 * @param config - User-supplied configuration from {@link provideFirebaseAILogic}.
 * @returns Config with safe defaults for optional fields.
 */
export function resolveFirebaseAILogicConfig(
  config: FirebaseAILogicConfig,
): ResolvedFirebaseAILogicConfig {
  const production = config.production ?? false;

  return {
    ...config,
    production,
    useLimitedUseAppCheckTokens:
      config.useLimitedUseAppCheckTokens ?? production,
    enableDevDiagnostics: config.enableDevDiagnostics ?? !production,
    diagnosticsLabel: config.diagnosticsLabel ?? 'ngx-firebase-ai-logic',
    probeModel: config.probeModel ?? 'gemini-3.1-flash-lite',
  };
}
