import { InjectionToken } from '@angular/core';
import type { FirebaseApp } from '@angular/fire/app';
import type { AI } from 'firebase/ai';
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
 * Firebase AI Logic client configured with App Check attestation.
 *
 * Inject this token in your services instead of calling `getAI()` directly.
 */
export const FIREBASE_AI = new InjectionToken<AI>('FIREBASE_AI');
