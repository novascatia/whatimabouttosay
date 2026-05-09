exports.handler = async (event) => {
    const { code, error } = event.queryStringParameters || {};
    
    // Jika user batal login atau error
    if (error || !code) {
        return { statusCode: 302, headers: { 'Location': 'https://novascatia.my.id/' } };
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';

    try {
        const fetch = (await import('node-fetch')).default;
        const p1 = "accounts"; const p2 = "spotify"; const p3 = "com";
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
        
        // Lempar token ke frontend secara gaib
        if (data.access_token) {
            return {
                statusCode: 302,
                headers: { 'Location': `https://novascatia.my.id/#access_token=${data.access_token}` },
            };
        } else {
            return { statusCode: 302, headers: { 'Location': 'https://novascatia.my.id/' } };
        }
    } catch (err) {
        return { statusCode: 302, headers: { 'Location': 'https://novascatia.my.id/' } };
    }
};
