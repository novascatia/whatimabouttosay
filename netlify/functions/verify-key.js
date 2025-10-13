// netlify/functions/verify-key.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
    }

    try {
        const key = event.queryStringParameters.key;
        if (!key) {
            return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
        }

        const { data, error } = await supabase
            .from('script_keys')
            .select('id, created_at, duration, is_active')
            .eq('key_value', key)
            .single();

        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
        }

        if (!data.is_active) {
            return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
        }

        // Jika kunci unlimited
        if (data.duration === 0) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'text/plain' },
                body: 'VALID|UNLIMITED',
            };
        }

        // [[ ===== PERUBAHAN UTAMA DI SINI ===== ]]
        // Server sekarang yang menghitung sisa detik.
        const expiresAt = new Date(new Date(data.created_at).getTime() + data.duration * 1000);
        const now = new Date();
        const seconds_left = Math.floor((expiresAt - now) / 1000);

        if (seconds_left <= 0) {
            await supabase.from('script_keys').delete().eq('id', data.id);
            return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
        }

        // Kirim kembali sisa detik sebagai teks
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: `VALID|${seconds_left}`,
        };

    } catch (err) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID' };
    }
};