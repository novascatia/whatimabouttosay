const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async () => {
    try {
        // Ambil 500 pesan terbaru, yang cukup untuk mencakup room aktif
        const { data, error } = await supabase
            .from('chat_messages')
            .select('room_id, message, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) {
            return { statusCode: 500, body: JSON.stringify({ error: `Failed to fetch rooms: ${error.message}` }) };
        }

        const roomMap = {};
        for (const msg of data) {
            // Hanya simpan pesan paling baru untuk setiap room_id
            if (!roomMap[msg.room_id]) {
                roomMap[msg.room_id] = {
                    room_id: msg.room_id,
                    last_message: msg.message,
                    created_at: msg.created_at
                };
            }
        }
        
        // Urutkan berdasarkan waktu pesan terbaru
        const rooms = Object.values(roomMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rooms),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};