const API = '/.netlify/functions/sportsrc-proxy';
let currentCategory = 'football';
let allMatches = [];

document.getElementById('closePopup').addEventListener('click', () => {
  document.getElementById('welcomePopup').style.display = 'none';
});

document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  renderList(q ? allMatches.filter(m => matchLabel(m).toLowerCase().includes(q)) : allMatches);
});

async function apiFetch(params) {
  try {
    const res = await fetch(API + '?' + new URLSearchParams(params));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) { return { error: e.message }; }
}

function getHome(m) { return m.teams?.home?.name || m.title?.split(' vs ')[0] || m.title || '?'; }

function getAway(m) { 
  if (m.teams?.away?.name) return m.teams.away.name;
  if (m.title?.includes(' vs ')) return m.title.split(' vs ')[1];
  return null;
}

function matchLabel(m) { 
  const h = getHome(m);
  const a = getAway(m);
  return a ? h + ' ' + a : h;
}

function getPinType(m) {
  const label = matchLabel(m).toLowerCase();
  if (label.includes('manchester united')) return 'MU';
  if (label.includes('indonesia')) return 'INDO';
  return null;
}

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta' }) + ' WIB';
}

function badgeImg(url, alt) {
  if (!url) return `<img class="team-badge" src="notfound.jpeg" alt="${alt}" onerror="this.onerror=null;this.src='notfound.jpeg';">`;
  return `<img class="team-badge" src="${url}" alt="${alt}" onerror="this.onerror=null;this.src='notfound.jpeg';">`;
}

async function loadMatches(cat) {
  document.getElementById('matchList').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const res = await apiFetch({ data: 'matches', category: cat });
  if (res.error || !res.success) {
    document.getElementById('matchList').innerHTML = '<div style="padding:20px; color:#ff6b6b; text-align:center;">Gagal memuat: ' + (res.error||'') + '</div>';
    return;
  }
  allMatches = res.data || [];
  document.getElementById('matchCount').textContent = allMatches.length + ' matches';
  renderList(allMatches);
}

function renderList(matches) {
  const list = document.getElementById('matchList');
  if (!matches.length) { list.innerHTML = '<div style="padding:40px 20px; text-align:center; color:var(--muted); font-size: 14px;">Tidak ada pertandingan yang ditemukan.</div>'; return; }

  const pinnedMU = matches.filter(m => getPinType(m) === 'MU');
  const pinnedIndo = matches.filter(m => getPinType(m) === 'INDO');
  const rest = matches.filter(m => !getPinType(m));
  
  list.innerHTML = '';

  if (pinnedIndo.length) {
    const banner = document.createElement('div');
    banner.className = 'pinned-banner banner-indo';
    banner.innerHTML = `<span>🦅 Pinned by Garuda Fans</span>`;
    list.appendChild(banner);
    pinnedIndo.forEach(m => list.appendChild(makeItem(m, 'INDO')));
  }

  if (pinnedMU.length) {
    const banner = document.createElement('div');
    banner.className = 'pinned-banner banner-mu';
    banner.innerHTML = `<span>🔴 Pinned by The Reds</span>`;
    list.appendChild(banner);
    pinnedMU.forEach(m => list.appendChild(makeItem(m, 'MU')));
  }

  rest.forEach(m => list.appendChild(makeItem(m, null)));
}

function makeItem(m, pinType) {
  const el = document.createElement('div');
  el.className = 'match-item';
  
  const home = getHome(m);
  const away = getAway(m);
  const isSingle = !away || away === '?';

  const isLive = m.live === true;
  const timeStr = isLive ? 'LIVE' : (m.date ? formatTime(m.date) : 'TBD');
  
  const homeHighlight = (pinType === 'MU' && home.toLowerCase().includes('manchester united')) || (pinType === 'INDO' && home.toLowerCase().includes('indonesia'));
  const hClass = homeHighlight ? (pinType === 'MU' ? ' mu-highlight' : ' indo-highlight') : '';

  let teamsHtml = '';
  if (isSingle) {
    teamsHtml = `<div class="team-row">${badgeImg(m.teams?.home?.badge,home)}<span class="team-name single-event-title ${hClass}">${home}</span></div>`;
  } else {
    const awayHighlight = (pinType === 'MU' && away.toLowerCase().includes('manchester united')) || (pinType === 'INDO' && away.toLowerCase().includes('indonesia'));
    const aClass = awayHighlight ? (pinType === 'MU' ? ' mu-highlight' : ' indo-highlight') : '';
    teamsHtml = 
      `<div class="team-row">${badgeImg(m.teams?.home?.badge,home)}<span class="team-name${hClass}">${home}</span></div>` +
      `<div class="team-row">${badgeImg(m.teams?.away?.badge,away)}<span class="team-name${aClass}">${away}</span></div>`;
  }

  el.innerHTML =
    `<div class="match-time${isLive?' live':''}">${timeStr}</div>` +
    `<div class="match-teams-col">` + teamsHtml + `</div>` +
    `<div class="play-btn">▶</div>`;

  el.addEventListener('click', () => {
    document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    
    document.getElementById('mainLayout').classList.add('active-player');
    
    if (window.innerWidth <= 900) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    loadStream(m.category || currentCategory, m.id, m);
  });
  return el;
}

async function loadStream(cat, id, m) {
  const home = getHome(m);
  const away = getAway(m);
  const isSingle = !away || away === '?';

  let matchBarTeamsHtml = '';
  if (isSingle) {
    matchBarTeamsHtml = `<div class="mbt">${badgeImg(m.teams?.home?.badge,home)}<span>${home}</span></div>`;
  } else {
    matchBarTeamsHtml = 
      `<div class="mbt">${badgeImg(m.teams?.home?.badge,home)}<span>${home}</span></div>` +
      `<span class="vs-sep">VS</span>` +
      `<div class="mbt"><span>${away}</span>${badgeImg(m.teams?.away?.badge,away)}</div>`;
  }

  document.getElementById('matchBarTeams').innerHTML = matchBarTeamsHtml;
  document.getElementById('matchBarMeta').textContent = m.live ? '🔴 LIVE STREAM' : (m.date ? formatTime(m.date) : 'Upcoming');

  const ea = document.getElementById('embedArea');
  ea.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="spinner"></div></div>';
  const sw = document.getElementById('streamSwitcher');
  sw.style.display = 'none'; sw.innerHTML = '';

  if (m.date && !m.live) {
    const diff = m.date - Date.now();
    if (diff > 10 * 60 * 1000) {
      const countdownId = 'cd_' + Date.now();
      ea.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center; background:#0f0f0f;">
        <div style="font-size:40px">⏳</div>
        <div style="font-size:24px; font-weight:700; color:var(--text)">BELUM WAKTUNYA</div>
        <div style="font-size:14px; color:var(--muted); max-width:300px; line-height:1.6;">Kamu baru bisa mengakses streaming 10 menit sebelum pertandingan dimulai!</div>
        <div style="font-size:16px; font-weight:500; color:var(--accent); margin-top:8px;" id="${countdownId}"></div>
      </div>`;

      function fmtCountdown() {
        const rem = m.date - Date.now();
        if (rem <= 0) return null;
        const totalSec = Math.floor(rem / 1000);
        const h = Math.floor(totalSec / 3600);
        const min = Math.floor((totalSec % 3600) / 60);
        const sec = totalSec % 60;
        return (h > 0 ? `${h}h ` : '') + `${min}m ${String(sec).padStart(2,'0')}s`;
      }

      const el = document.getElementById(countdownId);
      if (el) el.textContent = 'Mulai dalam: ' + (fmtCountdown() || '');

      const timer = setInterval(() => {
        const el = document.getElementById(countdownId);
        if (!el) { clearInterval(timer); return; }
        const val = fmtCountdown();
        if (!val) { clearInterval(timer); el.textContent = 'Mulai sekarang!'; return; }
        el.textContent = 'Mulai dalam: ' + val;
      }, 1000);
      return;
    }
  }

  const res = await apiFetch({ data: 'detail', category: cat, id });
  if (res.error || !res.success) {
    ea.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ff6b6b;font-weight:500;">Gagal memuat video: ${res.error||''}</div>`;
    return;
  }

  const sources = res.data?.sources || [];

  function applyEmbed(src) {
    const url = src.embedUrl || src.embed || src.url || '';
    if (!url) return false;
    ea.innerHTML = `<iframe src="${url}" allowfullscreen allow="autoplay;encrypted-media;picture-in-picture" referrerpolicy="no-referrer"></iframe>`;
    return true;
  }

  if (sources.length > 0) {
    applyEmbed(sources[0]);
    if (sources.length > 1) {
      sw.style.display = 'flex';
      sources.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'stream-btn' + (i === 0 ? ' active' : '');
        btn.textContent = (s.name || 'Server ' + (s.streamNo || i+1)) + (s.hd ? ' [HD]' : '');
        btn.addEventListener('click', () => {
          sw.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          applyEmbed(s);
        });
        sw.appendChild(btn);
      });
    }
  } else {
    ea.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);">Stream belum tersedia.</div>`;
  }
}

loadMatches(currentCategory);
