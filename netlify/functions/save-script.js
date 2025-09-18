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
        const { content, customUrl, overwrite } = JSON.parse(event.body);

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
            
            if (data && !overwrite) {
                return {
                    statusCode: 409, // Conflict
                    body: JSON.stringify({ message: `The link "${customUrl}" is already taken. Please choose another.` }),
                };
            }
            
            if (data && overwrite) {
                const { error: updateError } = await supabase
                    .from('scripts')
                    .update({ content: content })
                    .eq('id', customUrl);
                
                if (updateError) {
                    console.error('Supabase update error:', updateError);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ message: "Failed to overwrite script." }),
                    };
                }
                finalId = customUrl;
            } else {
                finalId = customUrl;
                const { error: insertError } = await supabase
                    .from('scripts')
                    .insert({ id: finalId, content: content });
                
                if (insertError) {
                    console.error('Supabase insert error:', insertError);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ message: "Failed to save script to database." }),
                    };
                }
            }
        } else {
            finalId = generateUniqueId();
            const { error: insertError } = await supabase
                .from('scripts')
                .insert({ id: finalId, content: content });
            
            if (insertError) {
                console.error('Supabase insert error:', insertError);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ message: "Failed to save script to database." }),
                };
            }
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