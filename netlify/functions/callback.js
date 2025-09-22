exports.handler = async (event) => {
    const { code } = event.queryStringParameters;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback';

    // Impor node-fetch secara dinamis
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
    
    // Untuk saat ini, kita akan mengembalikan tokennya
    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};