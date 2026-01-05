const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi sederhana untuk konversi link & baris baru
function formatPostContent(content) {
  // Convert Markdown-style links [text](url) to HTML
  let formatted = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Convert newlines to <br> for spacing
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

exports.handler = async (event) => {
    try {
        const pathSegments = event.path.split('/');
        const id = pathSegments[pathSegments.length - 1];
        
        // --- ERROR HANDLING UI (DARK MODE) ---
        const errorHtml = (msg) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Error</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
                <style>body{font-family:'Poppins',sans-serif;background:#121212;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}</style>
            </head>
            <body>
                <div>
                    <h1 class="text-3xl font-bold text-red-500 mb-4">Error</h1>
                    <p class="text-gray-400 mb-6">${msg}</p>
                    <a href="/" class="text-green-500 hover:underline">← Back to Home</a>
                </div>
            </body>
            </html>
        `;

        if (!id) return { statusCode: 400, headers: { 'Content-Type': 'text/html' }, body: errorHtml("Post ID is required.") };

        const { data: post, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !post) return { statusCode: 404, headers: { 'Content-Type': 'text/html' }, body: errorHtml("Post not found.") };

        const formattedContent = formatPostContent(post.content);
        const dateStr = new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        // --- MAIN POST UI (MATCHING INDEX.HTML) ---
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
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

                <style>
                    :root {
                        --bg-color: #121212;
                        --card-bg: #181818;
                        --text-main: #ffffff;
                        --text-sub: #b3b3b3;
                        --spotify-green: #1ed760;
                        --font-main: 'Poppins', sans-serif;
                    }
                    body {
                        font-family: var(--font-main);
                        background-color: var(--bg-color);
                        color: var(--text-main);
                        margin: 0;
                        padding-bottom: 120px;
                    }
                    /* Header Gradient mirip Index */
                    .header-gradient {
                        background: linear-gradient(180deg, rgba(30,215,96,0.2) 0%, var(--bg-color) 100%);
                        padding: 60px 20px 40px 20px;
                    }
                    /* Konten Postingan */
                    .content-container {
                        background-color: var(--bg-color); /* Menyatu dengan background atau bisa #181818 */
                        color: #d1d5db;
                        font-size: 1.05rem;
                        line-height: 1.8;
                    }
                    .content-container a { color: var(--spotify-green); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s; }
                    .content-container a:hover { border-bottom-color: var(--spotify-green); }
                    
                    /* Player Styles (Sama persis dengan index.html) */
                    .spotify-player-bar {
                        position: fixed; bottom: 0; left: 0; width: 100%;
                        background-color: #181818; border-top: 1px solid #282828;
                        padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; z-index: 50;
                    }
                    .player-left { display: flex; align-items: center; width: 30%; min-width: 200px; }
                    .player-left img { width: 56px; height: 56px; border-radius: 4px; margin-right: 1rem; }
                    .player-center { width: 40%; max-width: 600px; display: flex; flex-direction: column; align-items: center; }
                    .progress-bar-bg { width: 100%; height: 4px; background-color: #4f4f4f; border-radius: 2px; margin-top: 8px; position: relative; }
                    .progress-bar-fill { height: 100%; background-color: var(--text-main); border-radius: 2px; width: 0%; }
                    
                    /* Custom Scrollbar */
                    ::-webkit-scrollbar { width: 10px; }
                    ::-webkit-scrollbar-track { background: var(--bg-color); }
                    ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
                    ::-webkit-scrollbar-thumb:hover { background: #555; }
                </style>
            </head>
            <body>

                <header class="header-gradient">
                    <div class="max-w-4xl mx-auto">
                        <a href="/" class="group text-sm font-bold tracking-widest uppercase mb-6 text-gray-400 hover:text-white inline-flex items-center transition">
                            <div class="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center mr-3 group-hover:bg-[#282828]">
                                <i class="fas fa-chevron-left text-sm"></i>
                            </div>
                            Back to Home
                        </a>
                        
                        <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">${post.title}</h1>
                        
                        <div class="flex items-center text-sm text-gray-400 font-medium">
                            <img src="/logo.png" class="w-6 h-6 rounded-full mr-2 grayscale opacity-70">
                            <span class="text-white">${post.author}</span>
                            <span class="mx-2">•</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </header>

                <main class="max-w-4xl mx-auto px-5 mb-10">
                    <div class="flex items-center py-4 mb-6 border-b border-[#282828]">
                        <div class="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center text-black cursor-pointer hover:scale-105 transition mr-4">
                            <i class="fas fa-book-open text-lg"></i> 
                        </div>
                        <i class="far fa-heart text-2xl text-gray-400 hover:text-white cursor-pointer mr-6"></i>
                        <i class="fas fa-share-alt text-2xl text-gray-400 hover:text-white cursor-pointer"></i>
                    </div>

                    <div class="content-container">
                        ${formattedContent}
                    </div>
                    
                    <div class="mt-12 pt-8 border-t border-[#282828] text-center">
                         <a href="/" class="text-sm font-bold text-gray-500 hover:text-white uppercase tracking-widest">Read More Posts</a>
                    </div>
                </main>

                <div id="spotifyPlayer" class="spotify-player-bar" style="display: none;">
                    <div class="player-left">
                        <img id="albumArt" src="" alt="Album Art">
                        <div class="flex flex-col justify-center overflow-hidden">
                            <a id="songTitleLink" href="#" target="_blank" class="hover:underline">
                                <h3 id="songTitle" class="text-sm font-semibold text-white truncate">Loading...</h3>
                            </a>
                            <p id="artistName" class="text-xs text-gray-400 truncate"></p>
                        </div>
                        <i class="far fa-heart text-gray-400 ml-4 hover:text-white cursor-pointer text-sm"></i>
                    </div>
                    <div class="player-center hidden md:flex">
                        <div class="text-xs text-green-500 mb-1">Rama is listening now</div>
                        <div class="flex items-center w-full gap-2 text-xs text-gray-400">
                            <span id="currentTime">0:00</span>
                            <div class="progress-bar-bg">
                                <div id="progressBar" class="progress-bar-fill"></div>
                            </div>
                            <span id="totalTime">0:00</span>
                        </div>
                    </div>
                    <div class="w-[30%] flex justify-end items-center gap-4">
                        <button id="closePlayerBtn" class="text-gray-400 hover:text-white transition">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                <script>
                    const spotifyPlayer = document.getElementById('spotifyPlayer');
                    const songTitle = document.getElementById('songTitle');
                    const artistName = document.getElementById('artistName');
                    const albumArt = document.getElementById('albumArt');
                    const progressBar = document.getElementById('progressBar');
                    const currentTime = document.getElementById('currentTime');
                    const totalTime = document.getElementById('totalTime');
                    const songTitleLink = document.getElementById('songTitleLink');
                    const closePlayerBtn = document.getElementById('closePlayerBtn');
                    
                    let playerVisible = true;
                    function formatTime(ms) {
                        const seconds = Math.floor((ms / 1000) % 60);
                        const minutes = Math.floor((ms / 1000 / 60) % 60);
                        return minutes + ':' + seconds.toString().padStart(2, '0');
                    }
                    async function fetchNowPlaying() {
                        try {
                            const response = await fetch('/.netlify/functions/now-playing');
                            const data = await response.json();
                            if (data.isPlaying && playerVisible) {
                                spotifyPlayer.style.display = 'flex';
                                songTitle.textContent = data.title;
                                artistName.textContent = data.artist;
                                albumArt.src = data.albumArt;
                                songTitleLink.href = data.songUrl;
                                const pct = (data.progress / data.duration) * 100;
                                progressBar.style.width = pct + '%';
                                currentTime.textContent = formatTime(data.progress);
                                totalTime.textContent = formatTime(data.duration);
                            } else {
                                spotifyPlayer.style.display = 'none';
                            }
                        } catch(e) {}
                    }
                    closePlayerBtn.addEventListener('click', () => { playerVisible = false; spotifyPlayer.style.display = 'none'; });
                    fetchNowPlaying();
                    setInterval(fetchNowPlaying, 1000); // Update 1 detik
                </script>
            </body>
            </html>
        `;

        return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: htmlContent };

    } catch (error) {
        return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: "Server Error: " + error.message };
    }
};
