exports.handler = async (event) => {
    const { code } = event.queryStringParameters;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';

    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    });

    const data = await response.json();
    
    // Redirect kembali ke index.html sambil membawa token di URL (hash)
    // Hash (#) aman karena tidak terkirim ke server, hanya bisa dibaca Javascript browser
    return {
        statusCode: 302,
        headers: {
            'Location': `https://novascatia.my.id/#access_token=${data.access_token}`,
        },
    };
};
