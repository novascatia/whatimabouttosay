// netlify/functions/verify-key.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { key } = JSON.parse(event.body);

        if (!key) {
            return { statusCode: 400, body: JSON.stringify({ valid: false, reason: 'Key not provided.' }) };
        }

        const { data, error } = await supabase
            .from('script_keys')
            .select('created_at, duration, is_active')
            .eq('key_value', key)
            .single();

        if (error || !data) {
            return { statusCode: 404, body: JSON.stringify({ valid: false, reason: 'Invalid key.' }) };
        }

        if (!data.is_active) {
            return { statusCode: 403, body: JSON.stringify({ valid: false, reason: 'Key has been deactivated.' }) };
        }

        // Cek jika kunci unlimited
        if (data.duration === 0) {
            return { statusCode: 200, body: JSON.stringify({ valid: true, reason: 'Unlimited key.' }) };
        }

        const createdAt = new Date(data.created_at);
        const expiresAt = new Date(createdAt.getTime() + data.duration * 1000);
        const now = new Date();

        if (now > expiresAt) {
            return { statusCode: 403, body: JSON.stringify({ valid: false, reason: 'Key has expired.' }) };
        }

        // Jika semua valid
        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                reason: 'Key is valid.',
                expires_at: expiresAt.toISOString() // Kirim waktu expired ke klien
            }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ valid: false, reason: error.message }) };
    }
};