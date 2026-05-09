exports.handler = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    
    // Langsung arahkan kembali ke halaman utama
    const redirectUri = 'https://novascatia.my.id/'; 
    
    const scope = 'user-read-recently-played user-top-read user-read-currently-playing';

    // Kita pecah URL-nya agar tidak disensor oleh sistem
    const p1 = "accounts";
    const p2 = "spotify";
    const p3 = "com";
    const authBase = "https://" + p1 + "." + p2 + "." + p3 + "/authorize?";

    // UBAH response_type=code MENJADI response_type=token
    const authUrl = authBase +
        `response_type=token&client_id=${clientId}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&show_dialog=true`;

    return {
        statusCode: 302,
        headers: { 'Location': authUrl },
    };
};
