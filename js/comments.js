// =============================================
// COMMENTS MODULE - Real-time Firestore + Local
// =============================================
const Comments = (() => {
  let comments = [];
  let unsubscribe = null;
  let currentFilter = 'approved';
  const STORAGE_KEY = 'bw_comments';

  function init() {
    if (fbFirestore) {
      setupRealtimeListener();
    } else {
      loadLocal();
      renderComments();
    }
    bindEvents();
    listenStorageChanges();
  }

  function setupRealtimeListener() {
    if (unsubscribe) unsubscribe();
    unsubscribe = fbFirestore
      .collection('comments')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        comments = [];
        snapshot.forEach(doc => {
          comments.push({ id: doc.id, ...doc.data() });
        });
        renderComments();
        updateCommentCounts();
      }, err => {
        console.warn('Firestore listener error, falling back:', err);
        loadLocal();
        renderComments();
      });
  }

  function loadLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      comments = data ? JSON.parse(data) : [];
    } catch { comments = []; }
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch {}
  }

  async function addComment(name, text, reaction) {
    const comment = {
      name: name || 'Anonymous',
      text: text.trim(),
      reaction: reaction || '',
      timestamp: Date.now(),
      date: new Date().toISOString(),
      approved: false,
      likes: 0,
      adminReply: ''
    };

    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').add(comment);
        showToast('Wish sent! Awaiting approval.');
        return;
      } catch (err) {
        console.warn('Firestore write failed, saving locally:', err);
      }
    }
    // Local fallback
    comment.approved = true;
    comment.id = 'local_' + Date.now();
    comments.unshift(comment);
    saveLocal();
    renderComments();
    updateCommentCounts();
    showToast('Wish sent!');
  }

  async function toggleLike(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').doc(commentId).update({
          likes: firebase.firestore.FieldValue.increment(1)
        });
        return;
      } catch {}
    }
    comment.likes = (comment.likes || 0) + 1;
    saveLocal();
    renderComments();
  }

  async function approveComment(commentId) {
    if (!Auth.isLoggedIn()) return;
    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').doc(commentId).update({ approved: true });
        showToast('Comment approved');
        return;
      } catch {}
    }
    const c = comments.find(x => x.id === commentId);
    if (c) { c.approved = true; saveLocal(); renderComments(); }
  }

  async function deleteComment(commentId) {
    if (!Auth.isLoggedIn()) return;
    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').doc(commentId).delete();
        showToast('Comment deleted');
        return;
      } catch {}
    }
    comments = comments.filter(c => c.id !== commentId);
    saveLocal();
    renderComments();
    updateCommentCounts();
  }

  async function addReply(commentId, reply) {
    if (!Auth.isLoggedIn()) return;
    if (fbFirestore) {
      try {
        await fbFirestore.collection('comments').doc(commentId).update({ adminReply: reply });
        showToast('Reply added');
        return;
      } catch {}
    }
    const c = comments.find(x => x.id === commentId);
    if (c) { c.adminReply = reply; saveLocal(); renderComments(); }
  }

  function renderComments(filter) {
    if (filter) currentFilter = filter;
    const feed = document.getElementById('commentsFeed');
    if (!feed) return;

    let visible = comments;
    if (currentFilter === 'approved') {
      visible = comments.filter(c => c.approved);
    }

    if (visible.length === 0) {
      feed.innerHTML = `<div class="comments-loading"><i class="fas fa-comment-dots"></i> No wishes yet. Be the first!</div>`;
      return;
    }

    feed.innerHTML = visible.map(c => `
      <div class="comment-card" data-id="${c.id}">
        <div class="comment-header">
          <img class="comment-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'A')}&background=random&size=36" alt="${c.name}">
          <span class="comment-name">${escapeHtml(c.name)}</span>
          <span class="comment-date">${timeAgo(c.timestamp || Date.parse(c.date))}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
        ${c.reaction ? `<div class="comment-reaction-display">${c.reaction}</div>` : ''}
        ${c.adminReply ? `<div class="comment-admin-reply"><i class="fas fa-reply"></i> <strong>Admin:</strong> ${escapeHtml(c.adminReply)}</div>` : ''}
        <div class="comment-actions">
          <button class="comment-like-btn" data-id="${c.id}">
            <i class="fas fa-heart"></i> ${c.likes || 0}
          </button>
        </div>
      </div>
    `).join('');

    // Bind like buttons
    feed.querySelectorAll('.comment-like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleLike(btn.dataset.id);
        Animations.heartBurst(btn.getBoundingClientRect().left, btn.getBoundingClientRect().top);
      });
    });
  }

  function updateCommentCounts() {
    const total = comments.length;
    const approved = comments.filter(c => c.approved).length;
    const pending = total - approved;
    // Update stats in dashboard if present
    const sTotal = document.getElementById('statComments');
    const sAppr = document.getElementById('statApproved');
    const sPend = document.getElementById('statPending');
    if (sTotal) sTotal.textContent = total;
    if (sAppr) sAppr.textContent = approved;
    if (sPend) sPend.textContent = pending;
  }

  function listenStorageChanges() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          comments = JSON.parse(e.newValue) || [];
          renderComments();
          updateCommentCounts();
        } catch {}
      }
    });
  }

  function bindEvents() {
    const form = document.getElementById('commentForm');
    if (!form) return;
    document.getElementById('commentSubmit')?.addEventListener('click', async () => {
      const name = document.getElementById('commenterName')?.value.trim() || 'Anonymous';
      const text = document.getElementById('commentText')?.value.trim();
      if (!text) { showToast('Please write a wish first!'); return; }
      const selectedReaction = form.querySelector('.reaction-option.selected');
      const reaction = selectedReaction ? selectedReaction.dataset.reaction : '';
      const reactionEmoji = { heart: '❤️', cake: '🎂', balloon: '🎈', confetti: '🎊', star: '⭐' }[reaction] || '';
      await addComment(name, text, reactionEmoji);
      document.getElementById('commentText').value = '';
      form.querySelectorAll('.reaction-option').forEach(r => r.classList.remove('selected'));
    });

    // Reaction options
    form.querySelectorAll('.reaction-option').forEach(opt => {
      opt.addEventListener('click', () => {
        form.querySelectorAll('.reaction-option').forEach(r => r.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  }

  function getComments() { return comments; }
  function getPendingCount() { return comments.filter(c => !c.approved).length; }

  return { init, addComment, approveComment, deleteComment, addReply, renderComments, getComments, getPendingCount, updateCommentCounts };
})();
