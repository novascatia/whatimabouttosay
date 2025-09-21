const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async () => {
    try {
        const { data: pinnedPost, error: pinnedError } = await supabase
            .from('posts')
            .select('id, title, description, created_at')
            .eq('is_pinned', true)
            .single();

        const { data: regularPosts, error: regularError } = await supabase
            .from('posts')
            .select('id, title, description, created_at')
            .eq('is_pinned', false)
            .order('created_at', { ascending: false });

        if (pinnedError && pinnedError.code !== 'PGRST116') {
            console.error('Error fetching pinned post:', pinnedError.message);
        }

        if (regularError) {
            console.error('Error fetching regular posts:', regularError.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error fetching posts' }),
            };
        }

        let posts = regularPosts || [];
        if (pinnedPost) {
            posts.unshift(pinnedPost);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(posts),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};