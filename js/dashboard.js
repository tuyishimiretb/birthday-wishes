// =============================================
// DASHBOARD MODULE - Admin Panel
// =============================================
const Dashboard = (() => {
  let comments = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function init() {
    Auth.init();
    document.addEventListener('authChange', handleAuthChange);
    bindTabs();
    bindFilters();
    bindSearch();
    bindExport();
    bindRefresh();
    bindPhotoRefresh();
    bindSettings();
    bindLogout();
    handleLogin();
    bindTableActions();
    initReplyModal();
  }

  function handleAuthChange(e) {
    const { user } = e.detail;
    if (user) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('dashboardContent').style.display = 'block';
      document.getElementById('dashUserEmail').textContent = user.email || 'Admin';
      loadData();
    } else {
      document.getElementById('loginOverlay').style.display = 'flex';
      document.getElementById('dashboardContent').style.display = 'none';
    }
  }

  function handleLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      try {
        await Auth.login(email, password);
        errEl.textContent = '';
      } catch (err) {
        errEl.textContent = err.message || 'Login failed. Check your credentials.';
      }
    });
  }

  function bindLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
    document.getElementById('dashLogout')?.addEventListener('click', () => Auth.logout());
  }

  function refreshLocalData() {
    try { comments = JSON.parse(localStorage.getItem('bw_comments')) || []; } catch { comments = []; }
  }

  function bindTableActions() {
    document.getElementById('commentsBody')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      const tr = btn.closest('tr');
      if (!tr) return;
      const id = tr.dataset.id;
      if (btn.classList.contains('approve')) approve(id);
      else if (btn.classList.contains('reply')) openReplyModal(id);
      else if (btn.classList.contains('delete')) del(id);
    });
  }

  function bindTabs() {
    document.querySelectorAll('.dash-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dash-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const content = document.getElementById(`tab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
        if (content) content.classList.add('active');
        // Re-read fresh data from localStorage before rendering
        if (tab.dataset.tab === 'overview' || tab.dataset.tab === 'comments') {
          refreshLocalData();
        }
        if (tab.dataset.tab === 'comments') renderCommentsTable();
        if (tab.dataset.tab === 'photos') renderPhotos();
        if (tab.dataset.tab === 'reactions') { renderReactionsChart(); }
        if (tab.dataset.tab === 'settings') loadSettingsValues();
        if (tab.dataset.tab === 'overview') updateOverview();
      });
    });
  }

  async function loadData() {
    await loadComments();
    await loadReactions();
    updateOverview();
    renderCommentsTable();
    renderPhotos();
    renderReactionsChart();
  }

  // --- Comments ---
  async function loadComments() {
    if (fbFirestore) {
      try {
        const snap = await fbFirestore.collection('comments').orderBy('timestamp', 'desc').get();
        comments = [];
        snap.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
        return;
      } catch {}
    }
    // Local fallback
    try {
      comments = JSON.parse(localStorage.getItem('bw_comments')) || [];
    } catch { comments = []; }
  }

  function renderCommentsTable() {
    const tbody = document.getElementById('commentsBody');
    if (!tbody) return;

    let filtered = [...comments];

    // Filter
    if (currentFilter === 'pending') filtered = filtered.filter(c => !c.approved);
    else if (currentFilter === 'approved') filtered = filtered.filter(c => c.approved);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.text || '').toLowerCase().includes(q)
      );
    }

    // Paginate
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const page = filtered.slice(start, start + PAGE_SIZE);

    if (page.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-muted">No comments found</td></tr>';
      renderPagination(totalPages);
      return;
    }

    tbody.innerHTML = page.map(c => `
      <tr data-id="${c.id}">
        <td><strong>${escapeHtml(c.name || 'Anonymous')}</strong></td>
        <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.text)}</td>
        <td>${c.reaction || '-'}</td>
        <td>${c.date ? new Date(c.date).toLocaleDateString() : timeAgo(c.timestamp)}</td>
        <td><span class="status-badge ${c.approved ? 'approved' : 'pending'}">${c.approved ? 'Approved' : 'Pending'}</span></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.adminReply ? escapeHtml(c.adminReply) : '<span class="text-muted">—</span>'}</td>
        <td>
          <div class="action-btns">
            ${!c.approved ? `<button class="action-btn approve" title="Approve"><i class="fas fa-check"></i></button>` : ''}
            <button class="action-btn reply" title="Reply"><i class="fas fa-reply"></i></button>
            <button class="action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(totalPages);
    updateStats();
  }

  function renderPagination(totalPages) {
    const el = document.getElementById('commentPagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderCommentsTable(); });
    });
  }

  function bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        renderCommentsTable();
      });
    });
  }

  function bindSearch() {
    const searchInput = document.getElementById('commentSearch');
    if (!searchInput) return;
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchQuery = searchInput.value;
        currentPage = 1;
        renderCommentsTable();
      }, 300);
    });
  }

  function bindExport() {
    document.getElementById('exportCommentsBtn')?.addEventListener('click', () => {
      const rows = [['Name', 'Comment', 'Reaction', 'Date', 'Status', 'Likes', 'Admin Reply']];
      comments.forEach(c => {
        rows.push([
          c.name || 'Anonymous',
          c.text || '',
          c.reaction || '',
          c.date ? new Date(c.date).toLocaleString() : '',
          c.approved ? 'Approved' : 'Pending',
          c.likes || 0,
          c.adminReply || ''
        ]);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `birthday-comments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      showToast('Comments exported!');
    });
  }

  function bindRefresh() {
    document.getElementById('refreshCommentsBtn')?.addEventListener('click', async () => {
      await loadComments();
      renderCommentsTable();
      showToast('Refreshed!');
    });
  }

  // --- Actions (exposed globally for inline onclick) ---
  function syncToLocal() {
    try { localStorage.setItem('bw_comments', JSON.stringify(comments)); } catch {}
  }

  async function approve(id) {
    if (!Auth.isLoggedIn()) return;
    if (fbFirestore) {
      try { await fbFirestore.collection('comments').doc(id).update({ approved: true }); } catch {}
    }
    const c = comments.find(x => x.id === id);
    if (c) c.approved = true;
    syncToLocal();
    try { if (typeof Comments !== 'undefined') Comments.approveComment(id); } catch {}
    renderCommentsTable();
    updateOverview();
  }

  async function del(id) {
    if (!Auth.isLoggedIn()) return;
    if (!confirm('Delete this comment?')) return;
    if (fbFirestore) {
      try { await fbFirestore.collection('comments').doc(id).delete(); } catch {}
    }
    comments = comments.filter(c => c.id !== id);
    syncToLocal();
    try { if (typeof Comments !== 'undefined') Comments.deleteComment(id); } catch {}
    renderCommentsTable();
    updateOverview();
  }

  let replyTargetId = null;

  function openReplyModal(id) {
    replyTargetId = id;
    const c = comments.find(x => x.id === id);
    const preview = document.getElementById('replyModalPreview');
    if (preview) {
      const name = c ? escapeHtml(c.name || 'Anonymous') : 'Unknown';
      const text = c ? escapeHtml((c.text || '').substring(0, 100)) : '';
      preview.innerHTML = `<strong>${name}:</strong> "${text}${(c?.text || '').length > 100 ? '...' : ''}"`;
    }
    document.getElementById('replyModalInput').value = '';
    document.getElementById('replyModal').style.display = 'flex';
    document.getElementById('replyModalInput').focus();
  }

  function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
    replyTargetId = null;
  }

  function initReplyModal() {
    document.getElementById('replyModalSend')?.addEventListener('click', () => {
      const input = document.getElementById('replyModalInput');
      const text = input.value.trim();
      if (!text) { showToast('Please enter a reply'); return; }
      sendReply(replyTargetId, text);
    });
    document.getElementById('replyModalCancel')?.addEventListener('click', closeReplyModal);
    document.getElementById('replyModalClose')?.addEventListener('click', closeReplyModal);
    document.getElementById('replyModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeReplyModal();
    });
    document.getElementById('replyModalInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('replyModalSend')?.click();
      }
    });
  }

  async function sendReply(id, trimmed) {
    if (!Auth.isLoggedIn()) return;
    if (!id || !trimmed) return;
    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').doc(id).update({ adminReply: trimmed });
      } catch (err) {
        console.warn('Failed to save reply to Firestore:', err);
      }
    }
    try {
      let localComments = JSON.parse(localStorage.getItem('bw_comments')) || [];
      const idx = localComments.findIndex(c => c.id === id);
      if (idx !== -1) {
        localComments[idx].adminReply = trimmed;
        localStorage.setItem('bw_comments', JSON.stringify(localComments));
      }
    } catch {}
    try { if (typeof Comments !== 'undefined') Comments.addReply(id, trimmed); } catch {}
    const c = comments.find(x => x.id === id);
    if (c) c.adminReply = trimmed;
    closeReplyModal();
    renderCommentsTable();
    showToast('Reply added');
  }

  // --- Photos ---
  async function renderPhotos() {
    const grid = document.getElementById('photosGrid');
    if (!grid) return;
    let photos = [];

    if (fbFirestore && fbStorage) {
      try {
        const snap = await fbFirestore.collection('photos').orderBy('timestamp', 'desc').get();
        snap.forEach(doc => photos.push({ id: doc.id, ...doc.data() }));
      } catch {}
    }

    // Also check localStorage
    try {
      const local = JSON.parse(localStorage.getItem('bw_photos')) || [];
      photos = [...photos, ...local];
    } catch {}

    if (photos.length === 0) {
      grid.innerHTML = '<p class="text-muted">No photos uploaded yet</p>';
      document.getElementById('statPhotos').textContent = '0';
      return;
    }

    document.getElementById('statPhotos').textContent = photos.length;

    grid.innerHTML = photos.map(p => `
      <div class="photo-card" data-id="${p.id || ''}">
        <img src="${p.url || p.dataUrl}" alt="Birthday photo" loading="lazy">
        <div class="photo-card-actions">
          <button class="delete-img"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');

    // Event delegation for photo delete
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-img');
      if (!btn) return;
      const card = btn.closest('.photo-card');
      if (!card) return;
      deletePhoto(card.dataset.id);
    });
  }

  function bindPhotoRefresh() {
    document.getElementById('refreshPhotosBtn')?.addEventListener('click', renderPhotos);
  }

  async function deletePhoto(id) {
    if (!Auth.isLoggedIn()) return;
    if (!confirm('Delete this photo?')) return;
    if (fbFirestore && id) {
      try {
        await fbFirestore.collection('photos').doc(id).delete();
      } catch {}
    }
    // Remove from local
    try {
      let local = JSON.parse(localStorage.getItem('bw_photos')) || [];
      local = local.filter(p => p.id !== id);
      localStorage.setItem('bw_photos', JSON.stringify(local));
    } catch {}
    renderPhotos();
  }

  // --- Reactions ---
  async function loadReactions() {
    // Reactions are stored in Firestore + localStorage
    if (fbFirestore) {
      try {
        const types = ['heart', 'cake', 'balloon', 'confetti', 'star'];
        for (const type of types) {
          const doc = await fbFirestore.collection('reactions').doc(type).get();
          if (doc.exists) {
            let local = {};
            try { local = JSON.parse(localStorage.getItem('bw_reactions')) || {}; } catch {}
            local[type] = doc.data().count || local[type] || 0;
            localStorage.setItem('bw_reactions', JSON.stringify(local));
          }
        }
      } catch {}
    }
  }

  function renderReactionsChart() {
    // Read reactions from localStorage
    let reactions = {};
    try { reactions = JSON.parse(localStorage.getItem('bw_reactions')) || {}; } catch { reactions = {}; }

    const types = ['heart', 'cake', 'balloon', 'confetti', 'star'];
    let maxVal = 0;
    types.forEach(t => { if ((reactions[t] || 0) > maxVal) maxVal = (reactions[t] || 0); });
    if (maxVal === 0) maxVal = 1;

    types.forEach(t => {
      const count = reactions[t] || 0;
      const pct = (count / maxVal) * 100;
      const bar = document.getElementById(`bar${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const countEl = document.getElementById(`count${t.charAt(0).toUpperCase() + t.slice(1)}`);
      if (bar) bar.style.width = `${pct}%`;
      if (countEl) countEl.textContent = count;
    });

    const total = types.reduce((sum, t) => sum + (reactions[t] || 0), 0);
    document.getElementById('statReactions').textContent = total;
  }

  // --- Settings ---
  async function syncSettingToFirestore(key, value) {
    if (fbFirestore) {
      try {
        await fbFirestore.collection('settings').doc('global').set({ [key]: value }, { merge: true });
      } catch {}
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      if (!res.ok) throw new Error();
    } catch {}
  }

  function bindSettings() {
    loadSettingsValues();
    // Name
    document.getElementById('saveNameBtn')?.addEventListener('click', () => {
      const name = document.getElementById('settingName').value.trim();
      if (name) {
        try { localStorage.setItem('bw_birthday_name', name); } catch {}
        syncSettingToFirestore('bw_birthday_name', name);
        showToast('Name saved!'); loadSettingsValues();
      }
    });
    // Date
    document.getElementById('saveDateBtn')?.addEventListener('click', () => {
      const date = document.getElementById('settingDate').value;
      if (date) { Countdown.setDate(date); syncSettingToFirestore('bw_birthday_date', date); showToast('Date saved!'); }
    });
    // Link expiry date
    document.getElementById('saveLinkExpiryBtn')?.addEventListener('click', () => {
      const expiry = document.getElementById('settingLinkExpiry').value;
      if (expiry) {
        try { localStorage.setItem('bw_link_expiry', expiry); } catch {}
        syncSettingToFirestore('bw_link_expiry', expiry);
        showToast('Link expiry date saved!');
      } else {
        try { localStorage.removeItem('bw_link_expiry'); } catch {}
        syncSettingToFirestore('bw_link_expiry', '');
        showToast('Link expiry cleared — link never expires based on this setting');
      }
    });
    // Emoji
    initEmojiPicker();
    document.getElementById('saveEmojiBtn')?.addEventListener('click', () => {
      const emoji = document.getElementById('settingCardEmoji').value.trim() || '🎂';
      try { localStorage.setItem('bw_card_emoji', emoji); } catch {}
      syncSettingToFirestore('bw_card_emoji', emoji);
      showToast('Card emoji saved!');
    });
    // Card message
    document.getElementById('saveCardMessageBtn')?.addEventListener('click', () => {
      const msg = document.getElementById('settingCardMessage').value.trim();
      if (msg) { try { localStorage.setItem('bw_card_message', msg); } catch {} syncSettingToFirestore('bw_card_message', msg); showToast('Card message saved!'); }
    });
    // Theme
    document.getElementById('saveThemeBtn')?.addEventListener('click', () => {
      const theme = document.getElementById('settingTheme').value;
      Themes.setTheme(theme); syncSettingToFirestore('bw_theme', theme); showToast('Theme saved!');
    });
    // Card style
    document.getElementById('saveCardStyleBtn')?.addEventListener('click', () => {
      const style = document.getElementById('settingCardStyle').value;
      try { localStorage.setItem('bw_card_style', style); } catch {}
      syncSettingToFirestore('bw_card_style', style);
      if (typeof Themes !== 'undefined') Themes.setCardStyle(style);
      showToast('Card style saved!');
    });
    // Admin email
    document.getElementById('saveAdminEmailBtn')?.addEventListener('click', () => {
      const email = document.getElementById('settingAdminEmail').value.trim();
      if (email) { try { localStorage.setItem('bw_admin_email', email); } catch {} syncSettingToFirestore('bw_admin_email', email); showToast('Admin email saved!'); }
    });
    // Confetti trigger
    document.getElementById('triggerConfettiBtn')?.addEventListener('click', () => {
      try { localStorage.setItem('bw_celebration_trigger', Date.now().toString()); } catch {}
      if (typeof Animations !== 'undefined') {
        Animations.addBurst(window.innerWidth / 2, window.innerHeight / 2);
      }
      showToast('🎉 Confetti burst! Check the main page!');
    });
    // Balloons trigger
    document.getElementById('triggerBalloonsBtn')?.addEventListener('click', () => {
      try { localStorage.setItem('bw_balloon_trigger', Date.now().toString()); } catch {}
      if (typeof Animations !== 'undefined') {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => Animations.addBurst(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight * 0.5
          ), i * 200);
        }
      }
      showToast('🎈 Balloons launched!');
    });
    // Reset all
    document.getElementById('resetAllBtn')?.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) return;
      if (!confirm('This will delete all local comments, reactions, photos, and settings. Continue?')) return;
      try {
        ['bw_comments', 'bw_reactions', 'bw_photos', 'bw_birthday_name', 'bw_birthday_date',
         'bw_birthday_photo', 'bw_card_emoji', 'bw_card_message', 'bw_card_style',
         'bw_celebration_trigger', 'bw_balloon_trigger', 'bw_link_expiry', 'bw_music_url'].forEach(k => localStorage.removeItem(k));
        showToast('All local data reset!');
        loadSettingsValues();
        updateOverview();
        renderCommentsTable();
        renderPhotos();
        renderReactionsChart();
      } catch { showToast('Failed to reset data'); }
    });
    // Photo upload
    initDashboardPhoto();
  }

  function initEmojiPicker() {
    document.querySelectorAll('.emoji-opt').forEach(el => {
      el.addEventListener('click', () => {
        document.getElementById('settingCardEmoji').value = el.dataset.emoji;
        document.querySelectorAll('.emoji-opt').forEach(e => e.style.background = 'none');
        el.style.background = 'var(--primary)';
        el.style.borderRadius = '8px';
      });
    });
  }

  function loadSettingsValues() {
    try {
      const name = localStorage.getItem('bw_birthday_name');
      if (name) document.getElementById('settingName').value = name;
    } catch {}
    try {
      const stored = localStorage.getItem('bw_birthday_date');
      if (stored) {
        const date = new Date(stored);
        if (!isNaN(date.getTime())) {
          document.getElementById('settingDate').value = date.toISOString().split('T')[0];
        }
      }
    } catch {}
    try {
      const emoji = localStorage.getItem('bw_card_emoji');
      if (emoji) document.getElementById('settingCardEmoji').value = emoji;
    } catch {}
    try {
      const msg = localStorage.getItem('bw_card_message');
      if (msg) document.getElementById('settingCardMessage').value = msg;
    } catch {}
    try {
      const theme = localStorage.getItem('bw_theme');
      if (theme) document.getElementById('settingTheme').value = theme;
    } catch {}
    try {
      const style = localStorage.getItem('bw_card_style');
      if (style) document.getElementById('settingCardStyle').value = style;
    } catch {}
    try {
      const email = localStorage.getItem('bw_admin_email');
      if (email) document.getElementById('settingAdminEmail').value = email;
    } catch {}
    try {
      const expiry = localStorage.getItem('bw_link_expiry');
      if (expiry) document.getElementById('settingLinkExpiry').value = expiry;
    } catch {}
  }

  function initDashboardPhoto() {
    const area = document.getElementById('dashPhotoArea');
    const input = document.getElementById('dashPhotoInput');
    const preview = document.getElementById('dashPhotoPreview');
    const empty = document.getElementById('dashPhotoEmpty');
    const saveBtn = document.getElementById('dashSavePhotoBtn');
    const removeBtn = document.getElementById('dashRemovePhotoBtn');
    if (!area) return;

    // Load existing photo
    try {
      const saved = localStorage.getItem('bw_birthday_photo');
      if (saved) {
        preview.src = saved;
        preview.style.display = 'block';
        empty.style.display = 'none';
        saveBtn.style.display = 'none';
        removeBtn.style.display = 'inline-flex';
      }
    } catch {}

    area.addEventListener('click', () => input?.click());
    input?.addEventListener('change', () => {
      if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.style.display = 'block';
          empty.style.display = 'none';
          saveBtn.style.display = 'inline-flex';
          removeBtn.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
      }
    });

    saveBtn?.addEventListener('click', () => {
      const dataUrl = preview.src;
      if (!dataUrl) return;
      try {
        localStorage.setItem('bw_birthday_photo', dataUrl);
        showToast('Birthday photo saved!');
        saveBtn.style.display = 'none';
        removeBtn.style.display = 'inline-flex';
      } catch { showToast('Failed to save photo'); }
    });

    removeBtn?.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) return;
      try { localStorage.removeItem('bw_birthday_photo'); } catch {}
      preview.src = '';
      preview.style.display = 'none';
      empty.style.display = 'block';
      saveBtn.style.display = 'none';
      removeBtn.style.display = 'none';
      showToast('Photo removed');
    });
  }

  // --- Overview ---
  function updateOverview() {
    updateStats();
    // Recent activity
    const el = document.getElementById('recentActivity');
    if (!el) return;
    const recent = comments.slice(0, 5);
    if (recent.length === 0) {
      el.innerHTML = '<p class="text-muted">No activity yet</p>';
      return;
    }
    el.innerHTML = recent.map(c => `
      <div class="activity-item">
        <i class="fas fa-comment"></i>
        <span><strong>${escapeHtml(c.name || 'Anonymous')}</strong> ${c.approved ? 'posted' : 'is waiting'} — "${escapeHtml((c.text || '').substring(0, 50))}${c.text?.length > 50 ? '...' : ''}"</span>
        <span class="comment-date">${timeAgo(c.timestamp)}</span>
      </div>
    `).join('');
  }

  function updateStats() {
    const total = comments.length;
    const approved = comments.filter(c => c.approved).length;
    const pending = total - approved;
    const sTotal = document.getElementById('statComments');
    const sAppr = document.getElementById('statApproved');
    const sPend = document.getElementById('statPending');
    if (sTotal) sTotal.textContent = total;
    if (sAppr) sAppr.textContent = approved;
    if (sPend) sPend.textContent = pending;
    // Update reactions from localStorage
    try {
      const r = JSON.parse(localStorage.getItem('bw_reactions')) || {};
      const totalR = Object.values(r).reduce((a, b) => a + (b || 0), 0);
      const el = document.getElementById('statReactions');
      if (el) el.textContent = totalR;
    } catch {}
    // Update photos count from localStorage
    try {
      const p = JSON.parse(localStorage.getItem('bw_photos')) || [];
      const el = document.getElementById('statPhotos');
      if (el) el.textContent = p.length;
    } catch {}
  }

  // Expose methods globally
  return { init, approve, del, sendReply, deletePhoto };
})();

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
