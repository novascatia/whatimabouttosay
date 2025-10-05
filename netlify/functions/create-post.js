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
        const { title, description, content, author, slug, is_pinned } = JSON.parse(event.body);
        const uniqueId = slug || generateUniqueId();

        if (is_pinned) {
            const { error: unpinError } = await supabase
                .from('posts')
                .update({ is_pinned: false })
                .eq('is_pinned', true);

            if (unpinError) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: unpinError.message }),
                };
            }
        }

        const { error } = await supabase
            .from('posts')
            .insert({ id: uniqueId, title, description, content, author, is_pinned });

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