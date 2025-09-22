const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('spotify_tokens')
        .select('refresh_token')
        .eq('id', 'spotify_user_token')
        .single();

    if (error || !data) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Refresh token not found.' }),
        };
    }

    const { refresh_token } = data;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    });

    const { access_token } = await refreshResponse.json();

    const profileResponse = await fetch('http://googleusercontent.com/spotify.com/4', {
        headers: {
            'Authorization': `Bearer ${access_token}`,
        },
    });
    
    const profileData = await profileResponse.json();

    return {
        statusCode: 200,
        body: JSON.stringify({
            username: profileData.display_name,
        }),
    };
};