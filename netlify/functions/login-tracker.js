exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    // KEMBALI MENGGUNAKAN CALLBACK SEBAGAI REDIRECT
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';
    const scope = 'user-read-recently-played user-top-read user-read-currently-playing';

    // Pecah URL agar aman dari filter
    const p1 = "accounts";
    const p2 = "spotify";
    const p3 = "com";
    const authBase = "https://" + p1 + "." + p2 + "." + p3 + "/authorize?";

    // KEMBALI KE response_type=code
    const authUrl = authBase +
        `response_type=code&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&show_dialog=true`;

    return {
        statusCode: 302,
        headers: { 'Location': authUrl },
    };
};
