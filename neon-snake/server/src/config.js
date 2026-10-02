const splitList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 3000),
  projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-famobi',
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080',
  corsOrigins: splitList(process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
};
