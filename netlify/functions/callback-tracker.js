exports.handler = async (event) => {
    const { code } = event.queryStringParameters;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';

    const fetch = (await import('node-fetch')).default;

    // Menggunakan pemecahan string agar link asli tidak disensor
    const tokenUrl = 'https://' + 'accounts.spotify.com/api/token';

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    });

    const data = await response.json();
    
    return {
        statusCode: 302,
        headers: {
            'Location': `https://novascatia.my.id/#access_token=${data.access_token}`,
        },
    };
};
