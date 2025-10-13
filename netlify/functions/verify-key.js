// netlify/functions/verify-key.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_METHOD' };
    }

    try {
        // Langsung coba parsing body, jika gagal, berarti formatnya salah
        const { key } = JSON.parse(event.body);

        if (!key) {
            return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_NO_KEY' };
        }

        const { data, error } = await supabase
            .from('script_keys')
            .select('id, created_at, duration, is_active')
            .eq('key_value', key)
            .single();

        // Jika kunci tidak ditemukan di database
        if (error || !data) {
            return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_NOT_FOUND' };
        }

        // Jika kunci dinonaktifkan
        if (!data.is_active) {
            return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_DEACTIVATED' };
        }

        // Cek kedaluwarsa
        if (data.duration > 0) {
            const expiresAt = new Date(new Date(data.created_at).getTime() + data.duration * 1000);
            if (new Date() > expiresAt) {
                // Hapus kunci yang sudah kedaluwarsa
                await supabase.from('script_keys').delete().eq('id', data.id);
                return { statusCode: 403, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_EXPIRED' };
            }
        }

        // Jika semua lolos, kunci valid
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: 'VALID',
        };

    } catch (err) {
        // Jika ada error lain (misal: JSON tidak valid)
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'INVALID_SERVER_ERROR' };
    }
};