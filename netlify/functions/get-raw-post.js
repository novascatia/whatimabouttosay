const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    try {
        const pathSegments = event.path.split('/');
        const id = pathSegments[pathSegments.length - 1];

        if (!id) {
            return {
                statusCode: 400,
                body: 'Post ID is required.',
            };
        }

        const { data: post, error } = await supabase
            .from('posts')
            .select('content')
            .eq('id', id)
            .single();

        if (error || !post) {
            return {
                statusCode: 404,
                body: 'Post not found.',
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
            body: post.content,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: error.message,
        };
    }
};