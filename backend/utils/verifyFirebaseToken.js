/**
 * Verify Firebase ID token via Identity Toolkit REST API.
 * Set FIREBASE_API_KEY in .env (same Web API key as the Firebase console).
 */
export const verifyFirebaseIdToken = async (idToken) => {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
        throw new Error('Firebase verification is not configured on the server');
    }

    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = data?.error?.message || 'Invalid Firebase token';
        throw new Error(msg);
    }

    const user = data?.users?.[0];
    if (!user?.localId || !user?.email) {
        throw new Error('Invalid Firebase token payload');
    }

    return {
        uid: user.localId,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        emailVerified: user.emailVerified === true || user.emailVerified === 'true',
    };
};
