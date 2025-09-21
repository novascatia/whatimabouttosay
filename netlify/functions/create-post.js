const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function generateUniqueId() {
    return crypto.randomBytes(6).toString('hex');
}

exports.handler = async (event) => {
    try {
        const { title, content, author } = JSON.parse(event.body);
        const uniqueId = generateUniqueId();

        const { error } = await supabase
            .from('posts')
            .insert({ id: uniqueId, title, content, author });

        if (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post created successfully.' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};