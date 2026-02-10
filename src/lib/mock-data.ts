import type { DataSource, DataItem } from './types';

// This file is no longer used for initial data sources, 
// as they are now fetched from Firestore.
// It is kept for its utility functions and mock API structure.


// --- MOCK DATA ITEMS ---

function createRandomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
