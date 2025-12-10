const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Gunakan SERVICE KEY untuk operasi INSERT sisi server yang aman
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { room_id, sender, message } = JSON.parse(event.body);

        if (!room_id || !sender || !message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing room_id, sender, or message.' }) };
        }

        const { error } = await supabase
            .from('chat_messages')
            .insert({ 
                room_id: room_id,
                sender: sender, 
                message: message 
            });

        if (error) {
            return { statusCode: 500, body: JSON.stringify({ error: `Failed to log: ${error.message}` }) };
        }

        return { statusCode: 200, body: JSON.stringify({ message: 'Logged successfully.' }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};