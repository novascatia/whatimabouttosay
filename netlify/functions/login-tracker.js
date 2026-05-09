exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    // URL ini WAJIB kamu tambahkan di Redirect URIs pada Spotify Developer Dashboard!
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';
    const scope = 'user-read-recently-played user-top-read user-read-currently-playing';

    const authUrl = 'https://accounts.spotify.com/authorize?' +
        `response_type=code&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return {
        statusCode: 302,
        headers: { 'Location': authUrl },
    };
};
