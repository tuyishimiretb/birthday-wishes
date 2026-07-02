// =============================================
// AUTHENTICATION MODULE
// =============================================
const Auth = (() => {
  let currentUser = null;

  function init() {
    if (!fbAuth) {
      console.warn('Auth: Firebase not available, using local admin mode');
      return;
    }
    fbAuth.onAuthStateChanged(user => {
      currentUser = user;
      const ev = new CustomEvent('authChange', { detail: { user } });
      document.dispatchEvent(ev);
    });
  }

  async function login(email, password) {
    if (!fbAuth || fbAuth._isInvalid) {
      // Fallback: simple local password check
      const stored = localStorage.getItem('bw_admin_password');
      const adminEmail = localStorage.getItem('bw_admin_email') || 'tuyishimireboscotb@gmail.com';
      if (email === adminEmail && password === (stored || '1525565@12')) {
        currentUser = { email, uid: 'local-admin' };
        const ev = new CustomEvent('authChange', { detail: { user: currentUser } });
        document.dispatchEvent(ev);
        return currentUser;
      }
      throw new Error('Invalid credentials');
    }
    try {
      const cred = await fbAuth.signInWithEmailAndPassword(email, password);
      return cred.user;
    } catch (err) {
      // If Firebase Auth fails due to invalid config, fall back to local
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || err.code === 'auth/configuration-not-found') {
        fbAuth._isInvalid = true;
        return login(email, password);
      }
      throw err;
    }
  }

  async function logout() {
    if (!fbAuth) {
      currentUser = null;
      const ev = new CustomEvent('authChange', { detail: { user: null } });
      document.dispatchEvent(ev);
      return;
    }
    await fbAuth.signOut();
  }

  function getUser() { return currentUser; }
  function isLoggedIn() { return !!currentUser; }

  return { init, login, logout, getUser, isLoggedIn };
})();
