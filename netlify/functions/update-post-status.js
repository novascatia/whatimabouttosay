const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id, is_hidden } = JSON.parse(event.body);

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Post ID is required.' }),
            };
        }
        
        if (typeof is_hidden !== 'boolean') {
             return {
                statusCode: 400,
                body: JSON.stringify({ error: 'is_hidden must be a boolean.' }),
            };
        }

        const { error } = await supabase
            .from('posts')
            .update({ is_hidden: is_hidden })
            .eq('id', id);

        if (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post status updated successfully.' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};