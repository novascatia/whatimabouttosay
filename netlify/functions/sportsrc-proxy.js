// netlify/functions/sportsrc-proxy.js
// Proxy untuk api.sportsrc.org agar tidak kena CORS block di browser

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const query = new URLSearchParams(params).toString();
  const url = `https://api.sportsrc.org/?${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    const text = await response.text();

    // Log sample ke console Netlify untuk debug
    console.log('URL fetched:', url);
    console.log('Response sample:', text.substring(0, 500));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
