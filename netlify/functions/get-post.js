const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi untuk mengonversi markdown link menjadi tag HTML
function convertLinksToHtml(content) {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  return content.replace(linkRegex, '<a href="$2" class="text-blue-500 hover:underline" target="_blank">$1</a>');
}

exports.handler = async (event) => {
    try {
        const pathSegments = event.path.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        if (!id) {
            const htmlError = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Post Not Found</title>
                    <link rel="icon" type="image/png" href="/logo.png">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                      body { font-family: ui-sans-serif, system-ui; }
                      body.dark { background-color: #1a202c; color: #e2e8f0; }
                      body.dark .bg-white { background-color: #2d3748; color: #e2e8f0; }
                      body.dark .text-gray-600 { color: #cbd5e0; }
                      body.dark .text-gray-800 { color: #e2e8f0; }
                    </style>
                </head>
                <body class="bg-gray-100 flex items-center justify-center min-h-screen">
                    <div class="text-center p-8 bg-white rounded-lg shadow-lg">
                        <h1 class="text-3xl font-bold mb-4">Post Not Found</h1>
                        <p class="text-gray-600">Post ID is required.</p>
                        <a href="/" class="mt-4 inline-block text-blue-500 hover:underline">Go back to main page</a>
                    </div>
                </body>
                </html>
            `;
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'text/html' },
                body: htmlError,
            };
        }
        
        const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !post) {
            const htmlError = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Post Not Found</title>
                    <link rel="icon" type="image/png" href="/logo.png">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                      body { font-family: ui-sans-serif, system-ui; }
                      body.dark { background-color: #1a202c; color: #e2e8f0; }
                      body.dark .bg-white { background-color: #2d3748; color: #e2e8f0; }
                      body.dark .text-gray-600 { color: #cbd5e0; }
                      body.dark .text-gray-800 { color: #e2e8f0; }
                    </style>
                </head>
                <body class="bg-gray-100 flex items-center justify-center min-h-screen">
                    <div class="text-center p-8 bg-white rounded-lg shadow-lg">
                        <h1 class="text-3xl font-bold mb-4">Post Not Found</h1>
                        <p class="text-gray-600">${error ? error.message : 'The post you are looking for does not exist.'}</p>
                        <a href="/" class="mt-4 inline-block text-blue-500 hover:underline">Go back to main page</a>
                    </div>
                </body>
                </html>
            `;
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'text/html' },
                body: htmlError,
            };
        }

        const formattedContent = convertLinksToHtml(post.content).replace(/\n/g, '<br>');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${post.title}</title>
                <link rel="icon" type="image/png" href="/logo.png">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { font-family: ui-sans-serif, system-ui; }
                  body.dark {
                      background-color: #1a202c;
                      color: #e2e8f0;
                  }
                  body.dark .bg-white {
                      background-color: #2d3748;
                      color: #e2e8f0;
                  }
                  body.dark .text-gray-600 { color: #cbd5e0; }
                  body.dark .text-gray-800 { color: #e2e8f0; }
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
                    <a href="/" class="text-blue-500 hover:underline mb-4 inline-block">← Back to blog</a>
                    <h1 class="text-3xl font-bold mt-4 mb-2">${post.title}</h1>
                    <p class="text-gray-600 text-sm mb-4">Posted on ${new Date(post.created_at).toLocaleDateString()} by ${post.author}</p>
                    <div class="text-gray-800">${formattedContent}</div>
                </div>
                <script>
                    const isDarkMode = localStorage.getItem('theme') === 'dark';
                    if (isDarkMode) {
                        document.body.classList.add('dark');
                    }
                </script>
            </body>
            </html>
        `;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: htmlContent,
        };
    } catch (error) {
        const htmlError = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error</title>
                <link rel="icon" type="image/png" href="/logo.png">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  body { font-family: ui-sans-serif, system-ui; }
                  body.dark { background-color: #1a202c; color: #e2e8f0; }
                  body.dark .bg-white { background-color: #2d3748; color: #e2e8f0; }
                  body.dark .text-gray-600 { color: #cbd5e0; }
                  body.dark .text-gray-800 { color: #e2e8f0; }
                </style>
            </head>
            <body class="bg-gray-100 flex items-center justify-center min-h-screen">
                <div class="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h1 class="text-3xl font-bold mb-4">An Error Occurred</h1>
                    <p class="text-red-500">${error.message}</p>
                </div>
            </body>
            </html>
        `;
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'text/html' },
            body: htmlError,
        };
    }
};