// =============================================
// MAIN APPLICATION - Birthday Wishes
// =============================================
const App = (() => {
  // --- Initialize Modules ---
  async function init() {
    // Check if link has expired
    if (checkLinkExpiry()) return;

    // Load global settings from Firestore (if configured)
    await loadSettingsFromFirestore();

    // Loader
    setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hidden');
    }, 2200);

    // Set footer year
    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Init all modules
    Animations.init();
    Themes.init();
    Countdown.init();
    Comments.init();
    Messages.init();

    // Init music controls
    initMusic();
    // Init reactions
    initReactions();
    // Init share
    initShare();
    // Init navbar
    initNavbar();
    // Init scroll
    initScroll();
    // Init hero particles
    initHeroParticles();

    // GSAP scroll animations
    if (typeof gsap !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      Animations.animateEntrance();
    }

    // Restore saved name and photo
    restoreName();
    restoreAdminPhoto();
    restoreCardSettings();

    // Check for celebration triggers from admin dashboard
    checkCelebrationTriggers();

    console.log('Birthday Wishes initialized! 🎉');
  }

  function checkLinkExpiry() {
    try {
      let expiryStr = localStorage.getItem('bw_link_expiry');
      let label = 'Link expired on';
      if (!expiryStr) {
        expiryStr = localStorage.getItem('bw_birthday_date');
        label = 'Celebration was for';
      }
      if (expiryStr) {
        const targetDate = new Date(expiryStr);
        if (!isNaN(targetDate.getTime())) {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          if (targetDay < todayStart) {
            const overlay = document.getElementById('expiredOverlay');
            const dateEl = document.getElementById('expiredDate');
            if (overlay) {
              const formatted = targetDate.toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
              });
              if (dateEl) dateEl.textContent = `${label} ${formatted}`;
              overlay.style.display = 'flex';
            }
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
            return true;
          }
        }
      }
    } catch {}
    return false;
  }

  async function loadSettingsFromFirestore() {
    let data = null;
    if (fbFirestore) {
      try {
        const doc = await fbFirestore.collection('settings').doc('global').get();
        if (doc.exists) data = doc.data();
      } catch {}
    }
    if (!data) {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) data = await res.json();
      } catch {}
    }
    if (data) {
      const settingKeys = ['bw_birthday_name', 'bw_birthday_date', 'bw_card_emoji', 'bw_card_message',
        'bw_card_style', 'bw_theme', 'bw_admin_email', 'bw_link_expiry', 'bw_music_url'];
      settingKeys.forEach(key => {
        if (data[key]) {
          try { localStorage.setItem(key, data[key]); } catch {}
        }
      });
    }
  }

  // --- Music Controls ---
  function initMusic() {
    const toggle = document.getElementById('musicToggle');
    const audio = document.getElementById('bgMusic');
    if (!toggle || !audio) return;

    let isPlaying = false;
    let isFallback = false;
    let audioCtx = null;
    let melodyTimer = null;

    // Apply custom music from admin dashboard
    let hasCustomMusic = false;
    try {
      const customMusic = localStorage.getItem('bw_music_url');
      if (customMusic) {
        hasCustomMusic = true;
        audio.querySelector('source').src = customMusic;
      }
    } catch {}
    audio.load();

    // Happy Birthday melody notes (frequency, duration)
    function playGeneratedMelody() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const notes = [
        [261.63, 0.3], [261.63, 0.3], [293.66, 0.6], [261.63, 0.6], [349.23, 0.6], [329.63, 0.9],
        [261.63, 0.3], [261.63, 0.3], [293.66, 0.6], [261.63, 0.6], [392.00, 0.6], [349.23, 0.9],
        [261.63, 0.3], [261.63, 0.3], [523.25, 0.6], [440.00, 0.6], [349.23, 0.6], [329.63, 0.6], [293.66, 0.9],
        [466.16, 0.3], [466.16, 0.3], [440.00, 0.6], [349.23, 0.6], [392.00, 0.6], [349.23, 0.9]
      ];
      function scheduleLoop() {
        let time = audioCtx.currentTime;
        notes.forEach(([freq, dur]) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.25, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.start(time);
          osc.stop(time + dur);
          time += dur;
        });
        melodyTimer = setTimeout(scheduleLoop, (time - audioCtx.currentTime) * 1000);
      }
      scheduleLoop();
    }

    function stopGeneratedMelody() {
      if (melodyTimer) { clearTimeout(melodyTimer); melodyTimer = null; }
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
    }

    function startPlayback() {
      if (isFallback) {
        try {
          playGeneratedMelody();
          setPlayingUI(true);
          return true;
        } catch {
          showToast('Could not start music');
          return false;
        }
      }
      audio.currentTime = 0;
      audio.play().then(() => {
        // Some browsers (file://) resolve play() even with missing file
        // Check if audio has valid data after a moment
        setTimeout(() => {
          if (audio.readyState === 0 || !isFinite(audio.duration) || audio.duration === 0) {
            audio.pause();
            isFallback = true;
            playGeneratedMelody();
          }
        }, 500);
        setPlayingUI(true);
      }).catch(() => {
        // Source missing / autoplay blocked — use generated melody
        isFallback = true;
        try {
          playGeneratedMelody();
          setPlayingUI(true);
        } catch {
          showToast('No music file found. Add MP3 to assets/music/');
        }
      });
      return true;
    }

    function stopPlayback() {
      if (isFallback) {
        stopGeneratedMelody();
      } else {
        audio.pause();
      }
      setPlayingUI(false);
    }

    function setPlayingUI(playing) {
      isPlaying = playing;
      if (playing) {
        toggle.classList.add('playing');
        toggle.querySelector('i').className = 'fas fa-music fa-beat';
        document.querySelector('.music-tooltip').textContent = 'Now Playing 🎵';
        showToast('🎵 Birthday music playing!');
      } else {
        toggle.classList.remove('playing');
        toggle.querySelector('i').className = 'fas fa-music';
        document.querySelector('.music-tooltip').textContent = 'Music paused';
      }
    }

    // Detect missing file as fallback
    audio.addEventListener('error', () => {
      isFallback = true;
    }, { once: true });

    // Also check after load attempt (catches file:// quirks)
    setTimeout(() => {
      if (audio.readyState === 0 && !hasCustomMusic) {
        isFallback = true;
      }
    }, 1000);

    toggle.addEventListener('click', () => {
      if (isPlaying) {
        stopPlayback();
      } else {
        startPlayback();
      }
    });
  }

  function restoreName() {
    try {
      const name = localStorage.getItem('bw_birthday_name');
      if (name) {
        document.getElementById('heroNameDisplay').textContent = name;
        const cardName = document.getElementById('cardNameDisplay');
        if (cardName) cardName.textContent = name;
        const cardTitle = document.getElementById('cardTitle');
        if (cardTitle) cardTitle.textContent = `Happy Birthday, ${name}!`;
        document.title = `Happy Birthday ${name}! 🎂`;
      }
    } catch {}
  }

  function restoreAdminPhoto() {
    try {
      const photoUrl = localStorage.getItem('bw_birthday_photo');
      if (photoUrl) {
        const cardPhoto = document.getElementById('cardPhoto');
        if (cardPhoto) {
          cardPhoto.src = photoUrl;
          cardPhoto.style.display = 'block';
        }
      }
    } catch {}
  }

  function restoreCardSettings() {
    try {
      const emoji = localStorage.getItem('bw_card_emoji');
      if (emoji) document.getElementById('cardEmoji').textContent = emoji;
    } catch {}
    try {
      const msg = localStorage.getItem('bw_card_message');
      if (msg) document.getElementById('cardMessage').textContent = msg;
    } catch {}
    try {
      const style = localStorage.getItem('bw_card_style');
      if (style && typeof Themes !== 'undefined') Themes.setCardStyle(style);
    } catch {}
  }

  function checkCelebrationTriggers() {
    try {
      const confettiTime = localStorage.getItem('bw_celebration_trigger');
      if (confettiTime) {
        const elapsed = Date.now() - parseInt(confettiTime);
        if (elapsed < 60000) {
          Animations.addBurst(window.innerWidth / 2, window.innerHeight / 2);
          setTimeout(() => Animations.addBurst(
            Math.random() * window.innerWidth, Math.random() * window.innerHeight
          ), 500);
          showToast('🎉 Admin triggered a celebration!');
        }
        localStorage.removeItem('bw_celebration_trigger');
      }
    } catch {}
    try {
      const balloonTime = localStorage.getItem('bw_balloon_trigger');
      if (balloonTime) {
        const elapsed = Date.now() - parseInt(balloonTime);
        if (elapsed < 60000) {
          for (let i = 0; i < 5; i++) {
            setTimeout(() => Animations.addBurst(
              Math.random() * window.innerWidth,
              Math.random() * window.innerHeight * 0.5
            ), i * 300);
          }
          showToast('🎈 Balloons from admin!');
        }
        localStorage.removeItem('bw_balloon_trigger');
      }
    } catch {}
  }

  // --- Reactions ---
  function initReactions() {
    const container = document.getElementById('reactionsContainer');
    if (!container) return;

    // Load saved reactions
    let reactions = {};
    try { reactions = JSON.parse(localStorage.getItem('bw_reactions')) || {}; } catch {}

    // Initialize display
    updateReactionsDisplay(reactions);

    container.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.reaction;
        reactions[type] = (reactions[type] || 0) + 1;

        // Save
        try { localStorage.setItem('bw_reactions', JSON.stringify(reactions)); } catch {}

        // Animate
        btn.classList.remove('pop');
        void btn.offsetWidth; // reflow
        btn.classList.add('pop');

        // Trigger confetti burst
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        Animations.addBurst(cx, cy);

        // Show feedback
        const feedback = document.getElementById('reactionFeedback');
        if (feedback) {
          const msgs = {
            heart: '❤️ Sent love!',
            cake: '🎂 Added a cake!',
            balloon: '🎈 Released a balloon!',
            confetti: '🎊 Party time!',
            star: '⭐ You\'re a star!'
          };
          feedback.textContent = msgs[type] || 'Thanks!';
          clearTimeout(feedback._timeout);
          feedback._timeout = setTimeout(() => feedback.textContent = '', 2000);
        }

        // Try Firestore
        if (fbFirestore) {
          try {
            await fbFirestore.collection('reactions').doc(type).set({
              count: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
          } catch {}
        }

        updateReactionsDisplay(reactions);
      });
    });

    // Real-time updates from Firestore
    if (fbFirestore) {
      ['heart', 'cake', 'balloon', 'confetti', 'star'].forEach(type => {
        fbFirestore.collection('reactions').doc(type).onSnapshot(doc => {
          if (doc.exists) {
            reactions[type] = doc.data().count || reactions[type];
            updateReactionsDisplay(reactions);
          }
        }, () => {});
      });
    }
  }

  function updateReactionsDisplay(reactions) {
    const map = { heart: 'reactHeart', cake: 'reactCake', balloon: 'reactBalloon', confetti: 'reactConfetti', star: 'reactStar' };
    Object.entries(map).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = reactions[key] || 0;
    });
  }

  // --- Share ---
  function initShare() {
    const urlInput = document.getElementById('shareUrl');
    if (!urlInput) return;

    const pageUrl = window.location.href;
    urlInput.value = pageUrl;

    // Copy URL
    document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
      urlInput.select();
      navigator.clipboard.writeText(pageUrl).catch(() => document.execCommand('copy'));
      showToast('Link copied!');
    });

    // Social share links
    const name = localStorage.getItem('bw_birthday_name') || 'someone special';
    const text = `🎉 Join the birthday celebration for ${name}! 🎂`;

    const shareMap = {
      shareWhatsApp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + pageUrl)}`,
    };

    Object.entries(shareMap).forEach(([id, url]) => {
      const el = document.getElementById(id);
      if (el) el.href = url;
    });

    // Instagram: share via native sheet (shows Instagram on mobile) or fallback
    document.getElementById('shareInstagram')?.addEventListener('click', (e) => {
      e.preventDefault();
      const fullMsg = text + ' ' + pageUrl;
      if (navigator.share) {
        navigator.share({ title: 'Birthday Wishes', text: fullMsg })
          .catch(() => showToast('Share cancelled'));
      } else {
        navigator.clipboard.writeText(fullMsg).catch(() => {});
        showToast('🎉 Message copied! Paste it in your Instagram story or bio');
        window.open('https://www.instagram.com/', '_blank');
      }
    });

    // Native share
    document.getElementById('shareNativeBtn')?.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: 'Birthday Wishes', text, url: pageUrl })
          .catch(() => showToast('Share cancelled'));
      } else {
        showToast('Copy the link and share it!');
      }
    });
  }

  // --- Navbar ---
  function initNavbar() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    toggle?.addEventListener('click', () => {
      toggle.classList.toggle('active');
      links?.classList.toggle('open');
    });

    // Close on link click
    links?.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle?.classList.remove('active');
        links?.classList.remove('open');
      });
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }
    });
  }

  // --- Scroll ---
  function initScroll() {
    // Explore button
    document.getElementById('scrollCelebrate')?.addEventListener('click', () => {
      document.querySelector('#countdown')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // --- Hero Particles (CSS only decorative) ---
  function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    // Create floating decorative elements
    const emojis = ['🎂', '🎈', '🎉', '🎊', '💝', '✨', '🌟', '🎁'];
    for (let i = 0; i < 20; i++) {
      const el = document.createElement('div');
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 12}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.3 + 0.1};
        animation: float ${5 + Math.random() * 10}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
        transform: translateY(0);
        pointer-events: none;
        user-select: none;
      `;
      container.appendChild(el);
    }
    // Add CSS keyframe for floating
    if (!document.getElementById('floatStyle')) {
      const style = document.createElement('style');
      style.id = 'floatStyle';
      style.textContent = `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(3deg); }
          66% { transform: translateY(-10px) rotate(-2deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
