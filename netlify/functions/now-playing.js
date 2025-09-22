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
            statusCode: 200,
            body: JSON.stringify({ isPlaying: false, error: 'Refresh token not found.' }),
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

    const nowPlayingResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${access_token}`,
        },
    });

    if (nowPlayingResponse.status === 204) {
        return {
            statusCode: 200,
            body: JSON.stringify({ isPlaying: false }),
        };
    }

    const nowPlayingData = await nowPlayingResponse.json();
    const track = nowPlayingData.item;

    return {
        statusCode: 200,
        body: JSON.stringify({
            isPlaying: nowPlayingData.is_playing,
            title: track.name,
            artist: track.artists.map(artist => artist.name).join(', '),
            albumArt: track.album.images[0].url,
            songUrl: track.external_urls.spotify, // Tambahkan ini
            progress: nowPlayingData.progress_ms,
            duration: track.duration_ms
        }),
    };
};