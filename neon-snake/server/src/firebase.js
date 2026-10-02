import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { config } from './config.js';


process.env.FIRESTORE_EMULATOR_HOST = config.firestoreEmulatorHost;
process.env.METADATA_SERVER_DETECTION = 'none';

if (!config.projectId.startsWith('demo-')) {
  throw new Error(`FIREBASE_PROJECT_ID must start with "demo-" (got "${config.projectId}")`);
}

const app = initializeApp({ projectId: config.projectId });

export const db = getFirestore(app);
