// netlify/functions/verify-key.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'INVALID' };
    }

    try {
        const { key } = JSON.parse(event.body);
        if (!key) {
            return { statusCode: 400, body: 'INVALID' };
        }

        const { data, error } = await supabase
            .from('script_keys')
            .select('id, created_at, duration, is_active')
            .eq('key_value', key)
            .single();

        // **THIS IS THE FIX**: If the key is not found (error or no data), it's invalid.
        if (error || !data) {
            return { statusCode: 404, body: 'INVALID' };
        }

        if (!data.is_active) {
            return { statusCode: 403, body: 'INVALID' };
        }

        if (data.duration > 0) {
            const expiresAt = new Date(new Date(data.created_at).getTime() + data.duration * 1000);
            if (new Date() > expiresAt) {
                await supabase.from('script_keys').delete().eq('id', data.id);
                return { statusCode: 403, body: 'INVALID' };
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: 'VALID',
        };

    } catch (err) {
        return { statusCode: 500, body: 'INVALID' };
    }
};