(function() {
  const STORAGE_KEY = 'bw_birthday_notifications';
  let notifications = [];

  function init() {
    // Wait for dashboard auth
    const checkAuth = setInterval(function() {
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        clearInterval(checkAuth);
        loadNotifications();
        bindEvents();
      }
    }, 300);
    // Also listen for auth changes
    document.addEventListener('authChange', function(e) {
      if (e.detail.user) {
        loadNotifications();
        bindEvents();
      }
    });
  }

  function loadNotifications() {
    try {
      notifications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch(e) {
      notifications = [];
    }
    renderNotifications();
  }

  function renderNotifications() {
    const tbody = document.getElementById('notifBody');
    if (!tbody) return;
    if (notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-muted">No birthday notifications yet</td></tr>';
      updateBadge();
      return;
    }
    tbody.innerHTML = notifications.map(function(n) {
      const statusIcon = n.read
        ? '<span class="status-badge approved"><i class="fas fa-check"></i> Read</span>'
        : '<span class="status-badge pending"><i class="fas fa-clock"></i> New</span>';
      const dateStr = n.birthdayDate ? new Date(n.birthdayDate + 'T00:00:00').toLocaleDateString() : '-';
      const submittedStr = n.submittedAt ? new Date(n.submittedAt).toLocaleString() : '-';
      return '<tr data-id="' + n.id + '" class="' + (n.read ? '' : 'notif-unread') + '">' +
        '<td>' + statusIcon + '</td>' +
        '<td><strong>' + escapeHtml(n.birthdayName) + '</strong></td>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + escapeHtml(n.sender) + '</td>' +
        '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (n.message ? escapeHtml(n.message) : '<span class="text-muted">—</span>') + '</td>' +
        '<td>' + submittedStr + '</td>' +
        '<td><div class="action-btns">' +
          (n.read ? '' : '<button class="action-btn mark-read" title="Mark as read"><i class="fas fa-check"></i></button>') +
          '<button class="action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
    updateBadge();
    // Event delegation
    tbody.addEventListener('click', function(e) {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      const tr = btn.closest('tr');
      if (!tr) return;
      const id = tr.dataset.id;
      if (btn.classList.contains('mark-read')) markAsRead(id);
      else if (btn.classList.contains('delete')) deleteNotif(id);
    });
  }

  function markAsRead(id) {
    const n = notifications.find(function(x) { return x.id === id; });
    if (n) n.read = true;
    saveAndRender();
    showToast('Marked as read');
  }

  function deleteNotif(id) {
    if (!Auth.isLoggedIn()) return;
    if (!confirm('Delete this notification?')) return;
    notifications = notifications.filter(function(x) { return x.id !== id; });
    saveAndRender();
  }

  function saveAndRender() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)); } catch(e) {}
    renderNotifications();
  }

  function updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const unread = notifications.filter(function(n) { return !n.read; }).length;
    if (unread > 0) {
      badge.style.display = 'inline';
      badge.textContent = unread + ' new';
    } else {
      badge.style.display = 'none';
    }
  }

  function bindEvents() {
    document.getElementById('refreshNotifBtn')?.addEventListener('click', function() {
      loadNotifications();
      showToast('Refreshed!');
    });
    document.getElementById('clearReadNotifBtn')?.addEventListener('click', function() {
      if (!Auth.isLoggedIn()) return;
      notifications = notifications.filter(function(n) { return !n.read; });
      saveAndRender();
      showToast('Read notifications cleared');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
