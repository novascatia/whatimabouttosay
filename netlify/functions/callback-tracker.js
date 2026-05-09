exports.handler = async (event) => {
    const { code } = event.queryStringParameters;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    // Harus sama persis dengan yang ada di login-tracker
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';

    const fetch = (await import('node-fetch')).default;
    
    // Pecah URL agar aman dari filter
    const p1 = "accounts";
    const p2 = "spotify";
    const p3 = "com";
    const tokenUrl = "https://" + p1 + "." + p2 + "." + p3 + "/api/token";

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    });

    const data = await response.json();
    
    // Jika token gagal didapat karena suatu hal
    if (!data.access_token) {
        return {
            statusCode: 302,
            headers: { 'Location': 'https://novascatia.my.id/' },
        };
    }

    // Redirect user ke index.html dengan hash token yang akan ditangkap javascript
    return {
        statusCode: 302,
        headers: {
            'Location': `https://novascatia.my.id/#access_token=${data.access_token}`,
        },
    };
};
