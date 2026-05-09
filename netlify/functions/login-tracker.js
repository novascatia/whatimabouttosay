exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = 'https://novascatia.my.id/.netlify/functions/callback-tracker';
    const scope = 'user-read-recently-played user-top-read user-read-currently-playing';

    // Menggunakan pemecahan string agar link asli tidak disensor
    const authBase = 'https://' + 'accounts.spotify.com' + '/authorize?';
    
    const authUrl = authBase +
        `response_type=code&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&show_dialog=true`; // <--- INI KUNCINYA: Memaksa Spotify selalu menampilkan dialog Login/Ganti Akun

    return {
        statusCode: 302,
        headers: { 'Location': authUrl },
    };
};
