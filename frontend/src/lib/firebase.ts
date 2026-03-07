import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function initFirebase(config: { apiKey: string; authDomain: string; projectId: string }) {
  if (app) return { app, auth: auth! };
  app = initializeApp(config);
  auth = getAuth(app);
  return { app, auth };
}

export function getFirebaseAuth(): Auth | null {
  return auth;
}
