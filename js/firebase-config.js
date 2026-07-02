// =============================================
// FIREBASE CONFIGURATION
// =============================================
// To use this project:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Enable Firestore Database (Test mode)
// 4. Enable Authentication -> Sign-in method -> Email/Password
// 5. Enable Storage
// 6. Register a web app and copy the config below
// 7. Create an admin user in Firebase Auth
// =============================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let fbApp, fbFirestore, fbStorage, fbAuth;

// Detect placeholder config — skip Firebase init if not configured
const hasValidConfig = firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (!hasValidConfig) {
  console.warn('Firebase: Using placeholder config — running in local-only mode.');
  console.warn('Firebase: Edit js/firebase-config.js with your real Firebase project keys.');
} else {
  try {
    fbApp = firebase.initializeApp(firebaseConfig);
    fbFirestore = firebase.firestore();
    fbStorage = firebase.storage();
    fbAuth = firebase.auth();

    // Enable offline persistence
    fbFirestore.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('Firestore persistence:', err));

    console.log('Firebase initialized successfully');
  } catch (err) {
    console.warn('Firebase init error (using local fallback):', err);
  }
}
