/* ============================================================
   1. NAMA TAMU DARI URL
   Setiap tamu dikirim link berbeda, contoh:
     index.html?to=Bapak+Budi+Santoso
   Nama otomatis muncul di sampul & terisi di form RSVP.
   ============================================================ */
   (function applyGuestName(){
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to') || params.get('nama');
    const guestEl = document.getElementById('cover-guest-name');
  
    if(guestName && guestName.trim()){
      const cleanName = guestName.trim();
      guestEl.textContent = 'Kepada Yth. Bapak/Ibu/Saudara/i ' + cleanName;
  
      // isi otomatis form RSVP setelah halaman siap
      document.addEventListener('DOMContentLoaded', ()=>{
        const rsvpNameInput = document.getElementById('f-name');
        if(rsvpNameInput) rsvpNameInput.value = cleanName;
      });
      // fallback kalau script ini load setelah DOMContentLoaded
      if(document.readyState !== 'loading'){
        const rsvpNameInput = document.getElementById('f-name');
        if(rsvpNameInput) rsvpNameInput.value = cleanName;
      }
    }
  })();

/* ============================================================
  2. ENVELOPE / COVER INTERACTION
  ============================================================ */
  const cover = document.getElementById('cover');
  const envelope = document.getElementById('envelope');
  
  function openInvitation(){
    envelope.classList.add('open');
    setTimeout(()=>{
      cover.classList.add('opened');
      document.body.style.overflow = 'auto';
      startMusic();
    }, 550);
  }
  envelope.addEventListener('click', openInvitation);
  envelope.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') openInvitation(); });
  document.body.style.overflow = 'hidden';
  
  /* ============================================================
     3. SCROLL REVEAL
     ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el=>io.observe(el));
  
  /* ============================================================
     4. COUNTDOWN TIMER
     Target: 29 Desember 2026, 09:00 WIB (UTC+7)
     ============================================================ */
  const targetDate = new Date('2026-12-29T09:00:00+07:00').getTime();
  function updateCountdown(){
    const now = Date.now();
    const diff = Math.max(0, targetDate - now);
  
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
  
    document.getElementById('cd-days').textContent = String(days).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(mins).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(secs).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
  
  /* ============================================================
     5. STORAGE LAYER
     Memakai window.storage (tersimpan BERSAMA untuk semua tamu)
     kalau tersedia — ini hanya aktif saat undangan dibuka lewat
     panel artifact Claude.ai. Kalau file dibuka langsung di
     browser atau di-hosting di domain lain, window.storage TIDAK
     ada, jadi otomatis jatuh ke localStorage (tersimpan per
     perangkat/browser saja, tidak dibagikan ke tamu lain).
     ============================================================ */
  const hasSharedStorage = (typeof window.storage !== 'undefined' && window.storage !== null);
  let storageNoticeShown = false;
  
  function showStorageNotice(){
    if(storageNoticeShown) return;
    storageNoticeShown = true;
    const notice = document.createElement('div');
    notice.style.cssText = 'margin-top:14px;font-size:0.78rem;color:var(--ink-soft);background:var(--bg-deep);padding:12px 14px;border-left:2px solid var(--gold);text-align:left;';
    notice.textContent = 'Catatan: undangan ini sedang dibuka di luar Claude.ai, jadi konfirmasi hanya tersimpan di perangkat ini, belum otomatis dibagikan ke tamu lain. Untuk penyimpanan bersama secara online, undangan perlu di-hosting dengan backend seperti Firebase/Supabase.';
    document.getElementById('rsvp-form').appendChild(notice);
  }
  
  function localList(prefix){
    const keys = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  }
  
  const storageAPI = {
    async set(key, value){
      if(hasSharedStorage){
        return await window.storage.set(key, value, true);
      }
      localStorage.setItem(key, value);
      showStorageNotice();
      return { key, value, shared: false };
    },
    async list(prefix){
      if(hasSharedStorage){
        return await window.storage.list(prefix, true);
      }
      return { keys: localList(prefix) };
    },
    async get(key){
      if(hasSharedStorage){
        return await window.storage.get(key, true);
      }
      const value = localStorage.getItem(key);
      return value !== null ? { key, value, shared: false } : null;
    }
  };
  
  /* ============================================================
     6. AMPLOP DIGITAL — salin nomor rekening
     ============================================================ */
  document.querySelectorAll('.gift-copy').forEach(btn=>{
    const originalLabel = btn.textContent;
    btn.addEventListener('click', async ()=>{
      const number = btn.getAttribute('data-copy');
      try{
        if(navigator.clipboard && window.isSecureContext){
          await navigator.clipboard.writeText(number);
        } else {
          const tmp = document.createElement('textarea');
          tmp.value = number;
          tmp.style.position = 'fixed';
          tmp.style.opacity = '0';
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }
        btn.textContent = 'Tersalin!';
        btn.classList.add('copied');
        setTimeout(()=>{
          btn.textContent = originalLabel;
          btn.classList.remove('copied');
        }, 2000);
      }catch(err){
        console.error('Clipboard error:', err);
        btn.textContent = 'Gagal menyalin';
        setTimeout(()=>{ btn.textContent = originalLabel; }, 2000);
      }
    });
  });
  
  /* ============================================================
     7. RSVP FORM
     ============================================================ */
  // EDIT: URL Web App Google Apps Script kamu (lihat file apps-script-rsvp.gs)
  const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxMvp5pZQ3mx6nNGyfeidqaCVqtCprsJhm3vAXpURApDfZj2CAJSDPM9Kne-UkxU_8/exec';

  async function sendToSheet(entry){
    if(!SHEET_WEBHOOK_URL) return;
    try{
      // mode 'no-cors' dipakai karena Apps Script Web App tidak mengirim
      // header CORS ke fetch biasa; kita tidak perlu baca responsnya,
      // cukup kirim (fire-and-forget), datanya tetap masuk ke sheet.
      await fetch(SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          nama: entry.name,
          kehadiran: entry.attend,
          jumlah: entry.guests,
          ucapan: entry.message
        })
      });
    }catch(err){
      console.error('Gagal mengirim RSVP ke Google Sheets:', err);
    }
  }

  const rsvpForm = document.getElementById('rsvp-form');
  const formMsg = document.getElementById('form-msg');
  
  rsvpForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const attend = document.querySelector('input[name="attend"]:checked').value;
    const guests = document.getElementById('f-guests').value;
    const message = document.getElementById('f-message').value.trim();
  
    if(!name){ return; }
  
    const entry = {
      name, attend, guests, message,
      timestamp: Date.now()
    };
  
    const key = 'rsvp:' + entry.timestamp + '-' + Math.random().toString(36).slice(2,7);
  
    try{
      const result = await storageAPI.set(key, JSON.stringify(entry));
      sendToSheet(entry); // kirim ke Google Sheets secara paralel
      if(result){
        formMsg.textContent = 'Terima kasih! Konfirmasi Anda sudah tersimpan.';
        formMsg.classList.add('show');
        rsvpForm.reset();
        // beri jeda singkat supaya data sempat tersimpan di Google Sheets
        // sebelum buku tamu di-refresh dari sana
        setTimeout(loadGuestbook, 1200);
      } else {
        formMsg.textContent = 'Gagal menyimpan, silakan coba lagi.';
        formMsg.classList.add('show');
      }
    } catch(err){
      console.error('Storage error:', err);
      formMsg.textContent = 'Gagal menyimpan, silakan coba lagi.';
      formMsg.classList.add('show');
    }
  });
  
  /* ============================================================
     8. GUESTBOOK LIST
     Diambil dari Google Sheets (lewat doGet Apps Script) supaya
     SEMUA tamu melihat ucapan yang sama, bukan cuma dari
     perangkatnya sendiri. Kalau gagal (mis. tidak ada internet,
     atau SHEET_WEBHOOK_URL belum diisi), otomatis fallback ke
     storageAPI (window.storage / localStorage) sebagai cadangan.
     ============================================================ */
  async function loadGuestbook(){
    const listEl = document.getElementById('guestbook-list');

    // --- coba ambil dari Google Sheets dulu ---
    if(SHEET_WEBHOOK_URL){
      try{
        const res = await fetch(SHEET_WEBHOOK_URL, { method: 'GET' });
        if(res.ok){
          const entries = await res.json();
          if(Array.isArray(entries)){
            renderGuestbook(entries.sort((a,b)=> (b.timestamp||0) - (a.timestamp||0)));
            return;
          }
        }
      }catch(err){
        console.error('Gagal memuat buku tamu dari Google Sheets, fallback ke storage lokal:', err);
      }
    }

    // --- fallback: storageAPI (window.storage / localStorage) ---
    try{
      const result = await storageAPI.list('rsvp:');
      const keys = (result && result.keys) ? result.keys : [];
      const entries = [];
      for(const k of keys){
        try{
          const r = await storageAPI.get(k);
          if(r && r.value){ entries.push(JSON.parse(r.value)); }
        }catch(e){ /* skip broken entries */ }
      }
      entries.sort((a,b)=> (b.timestamp||0) - (a.timestamp||0));
      renderGuestbook(entries);
    }catch(err){
      console.error('Storage error:', err);
      listEl.innerHTML = '<div class="gb-empty">Belum ada ucapan yang bisa ditampilkan.</div>';
    }
  }

  function renderGuestbook(entries){
    const listEl = document.getElementById('guestbook-list');
    if(!entries || entries.length === 0){
      listEl.innerHTML = '<div class="gb-empty">Jadilah yang pertama memberi ucapan &amp; doa.</div>';
      return;
    }
    listEl.innerHTML = entries.map(en => `
      <div class="gb-item">
        <div class="gb-top">
          <span class="gb-name">${escapeHtml(en.name || 'Tamu')}</span>
          <span class="gb-att">${escapeHtml(en.attend || '')}</span>
        </div>
        ${en.message ? `<div class="gb-msg">${escapeHtml(en.message)}</div>` : ''}
      </div>
    `).join('');
  }

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  loadGuestbook();
  
  /* ============================================================
     9. BACKGROUND MUSIC — via YouTube IFrame Player API
     Memutar video RESMI dari kanal Awakening Records/Maher Zain
     (bukan file lagu yang disalin), player disembunyikan sehingga
     hanya audionya yang terdengar. Diputar saat amplop dibuka
     (dipicu klik pengguna) dan bisa di-mute lewat tombol musik.
  
     EDIT: ganti YT_VIDEO_ID kalau mau memakai video resmi lain
     (mis. versi cover/nasyid berbeda), ambil ID dari URL YouTube-nya,
     contoh: https://www.youtube.com/watch?v=XXXXXXXXXXX -> "XXXXXXXXXXX"
     ============================================================ */
  const YT_VIDEO_ID = 'R2QGZijERtw'; // Maher Zain - Baraka Allahu Lakuma (Official)
  const musicBtn = document.getElementById('music-toggle');
  
  let ytPlayer = null;
  let ytReady = false;
  let musicPlaying = false;
  let pendingPlay = false;
  
  function loadYouTubeAPI(){
    if(window.YT && window.YT.Player){ initYouTubePlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initYouTubePlayer;
  }
  
  function initYouTubePlayer(){
    ytPlayer = new YT.Player('yt-audio-player', {
      height: '0',
      width: '0',
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        loop: 1,
        playlist: YT_VIDEO_ID // required by YouTube for single-video looping
      },
      events: {
        onReady: ()=>{
          ytReady = true;
          ytPlayer.setVolume(70);
          if(pendingPlay){ ytPlayer.playVideo(); pendingPlay = false; }
        },
        onError: ()=>{
          console.error('Video musik tidak dapat diputar (mungkin diblokir region/embed).');
          musicPlaying = false;
          musicBtn.classList.remove('playing');
        }
      }
    });
  }
  
  function startMusic(){
    if(musicPlaying) return;
    musicPlaying = true;
    musicBtn.classList.add('playing');
    if(!ytPlayer){
      pendingPlay = true;
      loadYouTubeAPI();
    } else if(ytReady){
      ytPlayer.playVideo();
    } else {
      pendingPlay = true;
    }
  }
  function stopMusic(){
    musicPlaying = false;
    musicBtn.classList.remove('playing');
    if(ytPlayer && ytReady){ ytPlayer.pauseVideo(); }
    pendingPlay = false;
  }
  musicBtn.addEventListener('click', ()=>{
    if(musicPlaying){ stopMusic(); } else { startMusic(); }
  });