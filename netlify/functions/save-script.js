const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateUniqueId() {
  return crypto.randomBytes(3).toString('hex');
}

exports.handler = async (event) => {
    try {
        const { content, customUrl } = JSON.parse(event.body);

        if (!content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Content is required." }),
            };
        }

        let finalId;

        if (customUrl) {
            const { data } = await supabase
                .from('scripts')
                .select('id')
                .eq('id', customUrl)
                .single();
            
            if (data) {
                return {
                    statusCode: 409,
                    body: JSON.stringify({ message: `The link "${customUrl}" is already taken. Please choose another.` }),
                };
            }
            finalId = customUrl;
        } else {
            finalId = generateUniqueId();
        }

        const { error } = await supabase
            .from('scripts')
            .insert({ id: finalId, content: content });

        if (error) {
            console.error('Supabase insert error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Failed to save script to database." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ id: finalId }),
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected error occurred." }),
        };
    }
};