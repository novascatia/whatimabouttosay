const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Dapatkan kunci Supabase dari Environment Variable Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Buat instance Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi untuk membuat ID unik
function generateUniqueId() {
  return crypto.randomBytes(3).toString('hex');
}

exports.handler = async (event) => {
    try {
        const { content } = JSON.parse(event.body);
        if (!content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Content is required." }),
            };
        }

        const uniqueId = generateUniqueId();

        const { error } = await supabase
            .from('scripts')
            .insert({ id: uniqueId, content: content });

        if (error) {
            console.error('Supabase insert error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to save script to database." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ id: uniqueId }),
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected error occurred." }),
        };
    }
};