exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    // Jika Client ID tidak terbaca di Netlify
    if (!clientId) return { statusCode: 500, body: "Client ID Missing!" };

    // Kita kembalikan ke callback backend
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';
    const scope = 'user-read-private user-read-email user-read-recently-played user-top-read user-read-currently-playing';

    const p1 = "accounts"; const p2 = "spotify"; const p3 = "com";
    const authBase = "https://" + p1 + "." + p2 + "." + p3 + "/authorize?";

    const authUrl = authBase +
        `response_type=code` +
        `&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&show_dialog=true`;

    return {
        statusCode: 302,
        headers: { 'Location': authUrl },
    };
};
