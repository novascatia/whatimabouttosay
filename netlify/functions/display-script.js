const { createClient } = require('@supabase/supabase-js');

// Dapatkan kunci Supabase dari Environment Variable Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Buat instance Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    try {
        const pathSegments = event.path.split('/');
        const id = pathSegments[pathSegments.length - 1]; // Mengambil ID dari URL
        
        if (!id) {
            return {
                statusCode: 400,
                body: "Invalid request. Please provide a script ID.",
            };
        }
        
        // Mengambil script dari database berdasarkan ID
        const { data, error } = await supabase
            .from('scripts')
            .select('content')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Supabase fetch error:', error);
            return {
                statusCode: 404,
                body: "Script not found. The script ID may be incorrect or the script may have been deleted.",
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "text/plain" // Mengirim sebagai raw text
            },
            body: data.content,
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: "An unexpected error occurred.",
        };
    }
};