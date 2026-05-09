exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { code } = JSON.parse(event.body);
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        // Harus sama persis dengan yang ada di login-tracker
        const redirectUri = 'https://novascatia.my.id/'; 

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
        
        if (data.error) {
            return { statusCode: 400, body: JSON.stringify({ error: data.error }) };
        }

        // Kembalikan token ke index.html
        return {
            statusCode: 200,
            body: JSON.stringify({ access_token: data.access_token })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
