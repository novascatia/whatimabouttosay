// netlify/functions/verify-key.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Gunakan Service Key untuk melewati RLS
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

        if (error || !data) {
            return { statusCode: 404, body: 'INVALID' };
        }

        if (!data.is_active) {
            return { statusCode: 403, body: 'INVALID' };
        }

        // Jika kunci memiliki durasi (bukan unlimited)
        if (data.duration > 0) {
            const createdAt = new Date(data.created_at);
            const expiresAt = new Date(createdAt.getTime() + data.duration * 1000);
            const now = new Date();

            if (now > expiresAt) {
                // Kunci kedaluwarsa, hapus dari database
                await supabase.from('script_keys').delete().eq('id', data.id);
                return { statusCode: 403, body: 'INVALID' }; // Kirim INVALID setelah dihapus
            }
        }

        // Jika semua pengecekan lolos (termasuk kunci unlimited), kunci valid
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: 'VALID',
        };

    } catch (err) {
        return { statusCode: 500, body: 'INVALID' };
    }
};