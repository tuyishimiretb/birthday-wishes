(function() {
  const STORAGE_KEY = 'bw_birthday_notifications';

  function init() {
    const form = document.getElementById('notifyForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('notifyName').value.trim();
      const date = document.getElementById('notifyDate').value;
      const sender = document.getElementById('notifySender').value.trim();
      const message = document.getElementById('notifyMessage').value.trim();
      if (!name || !date) return;
      const notification = {
        id: 'notif_' + Date.now(),
        birthdayName: name,
        birthdayDate: date,
        sender: sender || 'Anonymous',
        message: message || '',
        timestamp: Date.now(),
        submittedAt: new Date().toISOString(),
        read: false
      };
      saveNotification(notification);
      form.reset();
      form.style.display = 'none';
      document.getElementById('notifySuccess').style.display = 'block';
    });
  }

  function saveNotification(notification) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      existing.unshift(notification);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch(e) {
      console.warn('Failed to save notification:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
