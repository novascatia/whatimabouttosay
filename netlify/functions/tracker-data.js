const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ambil Refresh Token
    const { data, error } = await supabase
        .from('spotify_tokens')
        .select('refresh_token')
        .eq('id', 'spotify_user_token')
        .single();

    if (error || !data) return { statusCode: 500, body: JSON.stringify({ error: 'Token tidak ditemukan.' }) };

    const { refresh_token } = data;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Refresh Token
    const fetch = (await import('node-fetch')).default;
    const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    });

    const { access_token } = await refreshResponse.json();

    // Dapatkan filter waktu dari URL (default: short_term / 4 minggu)
    const timeRange = event.queryStringParameters?.time_range || 'short_term';

    // Ambil Data (Recent & Top Tracks sesuai time range)
    const [recentRes, topTracksRes] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10?limit=30', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        }),
        fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10?time_range=${timeRange}&limit=20`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        })
    ]);

    const recentData = await recentRes.json();
    const topTracksData = await topTracksRes.json();

    return {
        statusCode: 200,
        body: JSON.stringify({
            recent: recentData.items ? recentData.items.map(item => ({
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                albumArt: item.track.album.images[0].url,
                playedAt: item.played_at,
                url: item.track.external_urls.spotify
            })) : [],
            topTracks: topTracksData.items ? topTracksData.items.map(track => ({
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                albumArt: track.album.images[0].url,
                url: track.external_urls.spotify
            })) : []
        })
    };
};
