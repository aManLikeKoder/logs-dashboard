'use client';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCIgcHwkimZvOjtmKI8mT5EUvBfkUOV8Y0",
  authDomain: "dashboard-settings-bf761.firebaseapp.com",
  projectId: "dashboard-settings-bf761",
  storageBucket: "dashboard-settings-bf761.appspot.com",
  messagingSenderId: "613505771043",
  appId: "1:613505771043:web:19bafc9b7d18d9e6053396"
};

let app: FirebaseApp;
const appName = 'dashboard-settings';

if (!getApps().some((app) => app.name === appName)) {
  app = initializeApp(firebaseConfig, appName);
} else {
  app = getApp(appName);
}

const db: Firestore = getFirestore(app);

export { db };
