// =============================================
// THEMES MODULE - Card Styles & Color Themes
// =============================================
const Themes = (() => {
  const STORAGE_KEY_THEME = 'bw_theme';
  const STORAGE_KEY_CARD = 'bw_card_style';

  function init() {
    loadTheme();
    loadCardStyle();
    bindThemePicker();
    bindCardStyles();

    // Listen for dashboard theme changes
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY_THEME) loadTheme();
    });
  }

  // --- Color Themes ---
  function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    try { localStorage.setItem(STORAGE_KEY_THEME, themeName); } catch {}
    // Update active state in picker
    document.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === themeName);
    });
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) || 'pastel';
    setTheme(saved);
  }

  function bindThemePicker() {
    const btn = document.querySelector('.theme-fab-btn');
    const panel = document.getElementById('themePanel');
    if (btn && panel) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) {
          panel.classList.remove('open');
        }
      });
    }

    document.querySelectorAll('.theme-option').forEach(el => {
      el.addEventListener('click', () => {
        setTheme(el.dataset.theme);
        // Restart canvas with appropriate particles
        Animations.stopConfetti();
        setTimeout(() => Animations.startConfetti(40), 100);
      });
    });
  }

  // --- Card Styles ---
  function setCardStyle(style) {
    const preview = document.getElementById('cardPreview');
    if (preview) {
      // Remove all card style classes
      ['classic', 'balloon', 'confetti', 'elegant', 'fun'].forEach(s => {
        preview.classList.remove(`card-style-${s}`);
      });
      preview.classList.add(`card-style-${style}`);
    }
    document.querySelectorAll('.card-style-btn').forEach(el => {
      el.classList.toggle('active', el.dataset.style === style);
    });
    try { localStorage.setItem(STORAGE_KEY_CARD, style); } catch {}
  }

  function loadCardStyle() {
    const saved = localStorage.getItem(STORAGE_KEY_CARD) || 'classic';
    setCardStyle(saved);
  }

  function bindCardStyles() {
    document.querySelectorAll('.card-style-btn').forEach(el => {
      el.addEventListener('click', () => {
        setCardStyle(el.dataset.style);
      });
    });
  }

  return { init, setTheme, setCardStyle };
})();
