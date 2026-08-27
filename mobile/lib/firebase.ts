import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  onAuthStateChanged,
  signInAnonymously,
  type Persistence,
  type User,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

/**
 * getReactNativePersistence only exists on RN builds. On native this
 * resolves through @firebase/auth (not the `firebase` wrapper — its
 * `firebase/auth` export map doesn't forward the "react-native" condition,
 * so the symbol is unreachable through it). On web we skip it entirely:
 * calling it there would throw, since the browser build doesn't export it.
 */
function getAuthPersistence(): Persistence {
  if (Platform.OS === 'web') {
    return browserLocalPersistence;
  }
  const { getReactNativePersistence } = require('@firebase/auth');
  return getReactNativePersistence(ReactNativeAsyncStorage);
}

// Same Firebase project as the web app (src/firebase.ts) — client config
// keys are not secret; access is enforced by Firestore security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAci5d5bg_OI_xZdYAmxf4jftAxnj2dxHI',
  authDomain: 'gymentrytracker.firebaseapp.com',
  projectId: 'gymentrytracker',
  storageBucket: 'gymentrytracker.firebasestorage.app',
  messagingSenderId: '566313471543',
  appId: '1:566313471543:web:d1dafa9e7f1a664d15f9b2',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getAuthPersistence(),
});

/**
 * Firestore's own persistentLocalCache requires IndexedDB, which doesn't
 * exist in React Native's JS environment — it fails at init and silently
 * falls back to an in-memory cache (confirmed via the runtime warning this
 * threw when first wired up). The `firebase` JS SDK does not offer working
 * offline persistence on RN; getting real Firestore-level offline queuing
 * would mean switching to @react-native-firebase's native SDK, a much
 * bigger native-module change out of scope here.
 *
 * PRD §21's actual requirement — an active workout survives backgrounding,
 * lock, and offline use — is met a different way instead: the workout
 * itself lives in AsyncStorage (lib/activeWorkoutStorage.ts) for the entire
 * time it's in progress, not in Firestore. Firestore is only touched once,
 * at Finish. If that single write fails (offline or otherwise), Train's
 * handleFinish deliberately does NOT clear the AsyncStorage record until
 * the write succeeds, so a failed Finish loses nothing — the workout is
 * still there to retry, not silently dropped.
 */
export const db = getFirestore(app);

/**
 * V1 accounts model (PRD §20): no login wall. Sign in anonymously on first
 * launch and stay signed in — "Protect & Sync Your Data" (upgrading to a
 * real account) is a later, explicit user action, not a startup gate.
 */
export function ensureAnonymousAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        unsubscribe();
        if (user) {
          resolve(user);
          return;
        }
        signInAnonymously(auth)
          .then(cred => resolve(cred.user))
          .catch(reject);
      },
      reject
    );
  });
}
