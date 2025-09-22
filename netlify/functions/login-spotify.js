exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback';
    const scope = 'user-read-currently-playing user-modify-playback-state user-read-playback-state streaming user-read-email user-read-private';

    const authUrl = 'https://accounts.spotify.com/authorize?' +
        `response_type=code&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return {
        statusCode: 302,
        headers: {
            'Location': authUrl,
        },
    };
};