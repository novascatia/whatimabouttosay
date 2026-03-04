// netlify/functions/fetch-sports.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
    const API_KEY = "1f213f2426d84c7cf32ce836f5a720fd";
    const { type, category, id } = event.queryStringParameters;

    // Susun URL berdasarkan parameter yang dikirim dari frontend
    let url = `https://api.sportsrc.org/v2/?api_key=${API_KEY}&type=${type || 'matches'}`;
    if (category) url += `&category=${category}`;
    if (id) url += `&id=${id}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch sports data" })
        };
    }
};
