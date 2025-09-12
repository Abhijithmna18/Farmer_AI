// src/config/firebase.js
/**
 * Firebase Admin SDK initialization + helper functions
 *
 * NOTE: In your .env, store FIREBASE_PRIVATE_KEY with literal newline chars escaped (e.g. use \n),
 * then we replace them below: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
 *
 * Exports:
 *  - admin: the firebase-admin module (initialized)
 *  - generateEmailVerificationLink(email): returns firebase-generated verification link
 *  - generatePasswordResetLink(email): returns firebase-generated reset link
 *  - verifyIdToken(idToken): verifies Firebase ID token (from client)
 *  - createCustomToken(uid, claims): create a custom token for uid (if needed)
 */

const admin = require('firebase-admin');

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  // We won't throw here — allow runtime to continue for dev envs, but warn.
  console.warn('FIREBASE env vars not fully set. Firebase Admin may not initialize.');
}

let initialized = false;

try {
  // fix private key newlines if they were escaped in env
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // private_key is required by admin.credential.cert
    private_key: privateKey,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  console.log('Firebase Admin initialized');
} catch (err) {
  // initialization can fail in local dev if env vars missing/unset; log helpful message
  console.warn('Firebase Admin initialization error (check FIREBASE env vars):', err.message || err);
}

const generateEmailVerificationLink = async (email) => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  // This generates a secure email verification link that you can send in your own email template
  return admin.auth().generateEmailVerificationLink(email);
};

const generatePasswordResetLink = async (email) => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  return admin.auth().generatePasswordResetLink(email);
};

const verifyIdToken = async (idToken) => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  return admin.auth().verifyIdToken(idToken);
};

const createCustomToken = async (uid, additionalClaims = {}) => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  return admin.auth().createCustomToken(uid, additionalClaims);
};

// Optional helper to get or create a Firebase user record (server-side)
const getOrCreateFirebaseUser = async ({ uid, email, phoneNumber, displayName }) => {
  if (!initialized) throw new Error('Firebase Admin not initialized');
  try {
    if (uid) {
      return admin.auth().getUser(uid);
    }
    if (email) {
      try {
        return await admin.auth().getUserByEmail(email);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          // create user
          return admin.auth().createUser({ email, phoneNumber, displayName });
        }
        throw err;
      }
    }
    throw new Error('Provide uid or email to get/create firebase user');
  } catch (err) {
    throw err;
  }
};

module.exports = {
  admin,
  generateEmailVerificationLink,
  generatePasswordResetLink,
  verifyIdToken,
  createCustomToken,
  getOrCreateFirebaseUser,
};
