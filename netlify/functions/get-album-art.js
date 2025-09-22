const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { url } = event.queryStringParameters;

    if (!url) {
        return {
            statusCode: 400,
            body: 'URL is required.',
        };
    }

    try {
        const response = await fetch(url);
        const buffer = await response.buffer();
        const base64 = buffer.toString('base64');
        const mime = response.headers.get('content-type');

        return {
            statusCode: 200,
            body: `data:${mime};base64,${base64}`,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Error fetching image.',
        };
    }
};