import { InjectionToken } from '@angular/core';
import type { AI } from 'firebase/ai';
import type { FirebaseApp } from 'firebase/app';
import type { AppCheck } from 'firebase/app-check';
import type { ResolvedFirebaseAILogicConfig } from './config';

/** Internal resolved configuration for App Check and AI factories. */
export const FIREBASE_AI_LOGIC_CONFIG = new InjectionToken<ResolvedFirebaseAILogicConfig>(
  'FIREBASE_AI_LOGIC_CONFIG',
);

/**
 * The initialized Firebase app instance shared by App Check and AI Logic.
 *
 * Created once in {@link provideFirebaseAILogic}.
 */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/**
 * Firebase App Check instance for the shared app.
 *
 * Initialized before {@link FIREBASE_AI} so attestation is ready for Gemini calls.
 */
export const FIREBASE_APP_CHECK = new InjectionToken<AppCheck>('FIREBASE_APP_CHECK');

/**
 * Firebase AI Logic client configured with App Check attestation.
 *
 * Inject this token in your services instead of calling `getAI()` directly.
 */
export const FIREBASE_AI = new InjectionToken<AI>('FIREBASE_AI');
