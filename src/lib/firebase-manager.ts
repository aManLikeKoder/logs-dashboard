'use client';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { DataSource } from './types';

const firebaseInstances = new Map<
  string,
  { app: FirebaseApp; firestore: Firestore }
>();

export function getFirebaseForSource(source: DataSource): {
  app: FirebaseApp;
  firestore: Firestore;
} | null {
  const appName = source.id;

  if (firebaseInstances.has(appName)) {
    return firebaseInstances.get(appName)!;
  }

  try {
    if (!source.firebaseConfig) {
      throw new Error('Firebase configuration is missing for this data source.');
    }
    const firebaseConfig = JSON.parse(source.firebaseConfig);
    
    const existingApp = getApps().find((app) => app.name === appName);
    const app = existingApp ?? initializeApp(firebaseConfig, appName);
    
    const firestore = getFirestore(app);

    const instance = { app, firestore };
    firebaseInstances.set(appName, instance);

    return instance;
  } catch (error: any) {
    console.error(`Failed to initialize Firebase for source: ${source.name}. Error: ${error.message}`);
    return null;
  }
}
