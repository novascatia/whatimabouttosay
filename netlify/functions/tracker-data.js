const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Ambil Refresh Token dari Supabase
    const { data, error } = await supabase
        .from('spotify_tokens')
        .select('refresh_token')
        .eq('id', 'spotify_user_token')
        .single();

    if (error || !data) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Token tidak ditemukan.' }) };
    }

    const { refresh_token } = data;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // 2. Refresh Access Token
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

    // 3. Ambil Data (Recent, Top Tracks, Top Artists)
    const [recentRes, topTracksRes, topArtistsRes] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        })
    ]);

    const recentData = await recentRes.json();
    const topTracksData = await topTracksRes.json();
    const topArtistsData = await topArtistsRes.json();

    return {
        statusCode: 200,
        body: JSON.stringify({
            recent: recentData.items.map(item => ({
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                albumArt: item.track.album.images[0].url,
                playedAt: new Date(item.played_at).toLocaleString('id-ID')
            })),
            topTracks: topTracksData.items.map(track => ({
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                albumArt: track.album.images[0].url
            })),
            topArtists: topArtistsData.items.map(artist => ({
                name: artist.name,
                image: artist.images[0].url
            }))
        })
    };
};
