const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function formatPostContent(content) {
  let formatted = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-cyan-500 hover:underline">$1</a>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

exports.handler = async (event) => {
    try {
        const pathSegments = event.path.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        const errorHtml = (msg) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8"><title>Error</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>body{background:#0f0f0f;color:#e5e5e5;display:flex;justify-content:center;align-items:center;height:100vh;font-family:'Plus Jakarta Sans',sans-serif;}</style>
            </head>
            <body><div><h1 class="text-xl font-bold text-red-500">${msg}</h1></div></body></html>`;

        if (!id) return { statusCode: 400, headers: { 'Content-Type': 'text/html' }, body: errorHtml("Post ID is required.") };

        const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();
        if (error || !post) return { statusCode: 404, headers: { 'Content-Type': 'text/html' }, body: errorHtml("Post not found.") };

        const formattedContent = formatPostContent(post.content);
        const dateStr = new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${post.title} - nova's space</title>
                <link rel="icon" type="image/png" href="/logo.png">
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f0f0f; color: #e5e5e5; margin: 0; }
                    .content-container { line-height: 1.8; color: #a1a1aa; }
                    
                    /* Spotify Player Bar */
                    .spotify-player-bar {
                        position: fixed; bottom: 0; left: 0; width: 100%; background-color: #181818;
                        border-top: 1px solid #282828; padding: 1rem 2rem; display: flex;
                        align-items: center; justify-content: space-between; z-index: 999;
                        transform: translateY(100%); transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
                    }
                    .spotify-player-bar.visible { transform: translateY(0); }
                    .progress-bar-bg { width: 100%; height: 4px; background-color: #4f4f4f; border-radius: 2px; margin-top: 8px; overflow: hidden; }
                    .progress-bar-fill { height: 100%; background-color: #1ed760; width: 0%; transition: width 1s linear; }
                </style>
            </head>
            <body class="p-6 md:p-12">
                <main class="max-w-3xl mx-auto mb-32">
                    <a href="/" class="text-sm font-bold text-zinc-500 hover:text-white transition uppercase tracking-widest block mb-12">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Archive
                    </a>

                    <header class="mb-12">
                        <span class="text-[10px] text-zinc-600 uppercase tracking-[0.3em] block mb-4">${dateStr}</span>
                        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white">${post.title}</h1>
                        <div class="flex items-center gap-3">
                            <img src="/logo.png" class="w-6 h-6 rounded-full grayscale opacity-50">
                            <span class="text-sm text-zinc-500 font-medium">${post.author}</span>
                        </div>
                    </header>

                    <article class="content-container text-lg">
                        ${formattedContent}
                    </article>
                </main>

                <div id="spotifyPlayer" class="spotify-player-bar">
                    <div class="flex items-center w-[30%] min-w-[200px]">
                        <img id="albumArt" src="" alt="" class="w-12 h-12 rounded-md mr-4 shadow-lg">
                        <div class="flex flex-col justify-center overflow-hidden">
                            <h3 id="songTitle" class="text-sm font-semibold text-white truncate"></h3>
                            <p id="artistName" class="text-xs text-gray-400 truncate"></p>
                        </div>
                    </div>

                    <div class="hidden md:flex flex-col items-center w-[40%]">
                        <div class="text-[10px] text-green-500 font-bold tracking-widest mb-1">Rama is listening to</div>
                        <div class="flex items-center w-full gap-3 text-[10px] text-gray-400 font-mono">
                            <span id="currentTime">0:00</span>
                            <div class="progress-bar-bg flex-grow">
                                <div id="progressBar" class="progress-bar-fill"></div>
                            </div>
                            <span id="totalTime">0:00</span>
                        </div>
                    </div>

                    <div class="w-[30%] flex justify-end">
                        <i class="fab fa-spotify text-green-500 text-xl"></i>
                    </div>
                </div>

                <script>
                    function formatTime(ms) {
                        const seconds = Math.floor((ms / 1000) % 60);
                        const minutes = Math.floor((ms / 1000 / 60) % 60);
                        return minutes + ':' + seconds.toString().padStart(2, '0');
                    }

                    async function fetchNowPlaying() {
                        try {
                            const response = await fetch('/.netlify/functions/now-playing');
                            const data = await response.json();
                            const player = document.getElementById('spotifyPlayer');
                            if (data.isPlaying) {
                                document.getElementById('songTitle').textContent = data.title;
                                document.getElementById('artistName').textContent = data.artist;
                                document.getElementById('albumArt').src = data.albumArt;
                                document.getElementById('progressBar').style.width = (data.progress / data.duration) * 100 + '%';
                                document.getElementById('currentTime').textContent = formatTime(data.progress);
                                document.getElementById('totalTime').textContent = formatTime(data.duration);
                                player.classList.add('visible'); 
                            } else {
                                player.classList.remove('visible');
                            }
                        } catch(e) {}
                    }
                    fetchNowPlaying();
                    setInterval(fetchNowPlaying, 1000);
                </script>
            </body>
            </html>
        `;
        return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: htmlContent };
    } catch (error) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: "Server Error: " + error.message };
    }
};
