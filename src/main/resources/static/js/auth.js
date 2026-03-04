/* ═══════════════════════════════════════════════════════════
   AETHER — auth.js
   Firebase Authentication stub.
   Runs in "bypass mode" until Firebase credentials are provided.
   When real credentials are added, set FIREBASE_ENABLED = true
   and fill in the firebaseConfig object below.
   ═══════════════════════════════════════════════════════════ */

const FIREBASE_ENABLED = true;

const firebaseConfig = {

    apiKey: "AIzaSyBQuO34qeW0WwWd_0OL_KQV0T_3_R-ENsY",

    authDomain: "aether-bf8ab.firebaseapp.com",

    projectId: "aether-bf8ab",

    storageBucket: "aether-bf8ab.firebasestorage.app",

    messagingSenderId: "1090321614604",

    appId: "1:1090321614604:web:00a7b4205090aa63536b29",

    measurementId: "G-P79Y3081T4"

};


// ── Public Interface ──────────────────────────────────────
window.Auth = {
    /** Returns the current ID token (or null in bypass mode). */
    getToken: () => window._authToken || null,

    /** Returns the current user object (Firebase or bypass stub). */
    getUser: () => window._authUser || null,

    /** Attaches Authorization header to all /api fetch calls. */
    fetchWithAuth: async (url, options = {}) => {
        const token = window.Auth.getToken();
        if (token) {
            options.headers = {
                ...(options.headers || {}),
                'Authorization': `Bearer ${token}`
            };
        }
        return fetch(url, options);
    }
};

// ── Mode Selection ────────────────────────────────────────
if (FIREBASE_ENABLED) {
    runFirebaseAuth();
} else {
    runBypassAuth();
}

// ── Bypass Mode (no Firebase) ─────────────────────────────
function runBypassAuth() {
    // In bypass mode: hide auth overlay, show app immediately.
    window._authToken = null;
    window._authUser = null;

    document.addEventListener('DOMContentLoaded', () => {
        const shell = document.getElementById('app-shell');
        const overlay = document.getElementById('auth-overlay');
        if (shell) shell.style.display = 'block';
        if (overlay) overlay.style.display = 'none';

        // Sign-out button becomes a no-op placeholder
        const signoutBtn = document.getElementById('btn-signout');
        if (signoutBtn) {
            signoutBtn.style.display = 'none';
        }

        // Signal app.js that auth is ready
        document.dispatchEvent(new Event('auth-ready'));
    });
}

// ── Firebase Mode (enabled when credentials are provided) ──
function runFirebaseAuth() {
    // Dynamically import Firebase SDK
    const script1 = loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
    const script2 = loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js');

    Promise.all([script1, script2]).then(() => {
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();

        auth.onAuthStateChanged(async (user) => {
            const shell = document.getElementById('app-shell');
            const overlay = document.getElementById('auth-overlay');

            if (user) {
                // Logged in
                const token = await user.getIdToken();
                window._authToken = token;
                window._authUser = user;

                // Refresh token every 55 minutes
                setInterval(async () => {
                    window._authToken = await user.getIdToken(true);
                }, 55 * 60 * 1000);

                // Show user info
                const avatar = document.getElementById('user-avatar');
                const navUser = document.getElementById('nav-user');
                if (avatar && user.photoURL) avatar.src = user.photoURL;
                if (navUser) navUser.style.display = 'flex';

                if (shell) shell.style.display = 'block';
                if (overlay) overlay.style.display = 'none';

                // Trigger app load (app.js listens for this event)
                document.dispatchEvent(new Event('auth-ready'));
            } else {
                // Not logged in
                window._authToken = null;
                window._authUser = null;
                if (shell) shell.style.display = 'none';
                if (overlay) overlay.style.display = 'flex';
            }
        });

        // Google Sign-In button
        document.getElementById('btn-google-signin')?.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => {
                console.error('Sign-in failed:', err);
            });
        });

        // Sign-Out
        document.getElementById('btn-signout')?.addEventListener('click', () => {
            auth.signOut();
        });
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
