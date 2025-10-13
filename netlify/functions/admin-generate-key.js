// netlify/functions/admin-generate-key.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    // Di sini Anda harus menambahkan verifikasi admin (misalnya, memeriksa cookie)
    // Untuk saat ini, kita anggap sudah terotentikasi

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { duration, note } = JSON.parse(event.body);

        if (typeof duration !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number.' }),
            };
        }

        const newKey = `growpai-${crypto.randomBytes(8).toString('hex')}`;

        const { error } = await supabase
            .from('script_keys')
            .insert({ 
                key_value: newKey, 
                duration: duration,
                note: note 
            });

        if (error) {
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Key generated successfully.', key: newKey }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};