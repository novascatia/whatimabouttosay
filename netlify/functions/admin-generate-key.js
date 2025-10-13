// netlify/functions/admin-generate-key.js
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { duration, note, customKey } = JSON.parse(event.body);

        if (typeof duration !== 'number') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Duration must be a number.' }),
            };
        }

        // Logika yang disederhanakan dan diperbaiki:
        let keyToInsert = customKey;
        if (!keyToInsert || keyToInsert.trim() === '') {
            keyToInsert = `Nova-${crypto.randomBytes(8).toString('hex')}`;
        }

        const { error } = await supabase
            .from('script_keys')
            .insert({ 
                key_value: keyToInsert, 
                duration: duration,
                note: note 
            });

        if (error) {
            if (error.code === '23505') {
                 return {
                    statusCode: 409, // Conflict
                    body: JSON.stringify({ error: `Key "${keyToInsert}" already exists.` }),
                };
            }
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Key generated successfully.', key: keyToInsert }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};