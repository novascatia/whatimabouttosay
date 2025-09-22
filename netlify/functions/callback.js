const { createClient } = require('@supabase/supabase-js');

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
    const { refresh_token } = data;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
        .from('spotify_tokens')
        .upsert({ id: 'spotify_user_token', refresh_token: refresh_token }, { onConflict: ['id'] });

    if (error) {
        return {
            statusCode: 500,
            body: 'Error saving token.',
        };
    }

    return {
        statusCode: 302,
        headers: {
            'Location': 'https://novascatia.my.id',
        },
    };
};