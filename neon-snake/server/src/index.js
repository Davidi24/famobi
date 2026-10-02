import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`Analytics API listening on http://localhost:${config.port}`);
  console.log(`Using Firestore emulator at ${config.firestoreEmulatorHost} (project ${config.projectId})`);
});
