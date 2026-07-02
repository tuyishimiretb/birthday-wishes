// =============================================
// BIRTHDAY MESSAGE GENERATOR
// =============================================
const Messages = (() => {
  const messages = [
    { text: "May your birthday be as wonderful and amazing as you are. Wishing you a day filled with love, laughter, and everything that makes you smile!", cat: "heartfelt" },
    { text: "Another year older, another year wiser, and definitely another year more fabulous! Happy Birthday!", cat: "funny" },
    { text: "Happy Birthday! 🎂 May your day be sprinkled with fun and filled with unforgettable moments.", cat: "short" },
    { text: "Like a candle in the wind, your light shines bright. Like the stars above, you guide us through the night. Happy Birthday, shining star!", cat: "poetic" },
    { text: "You're not getting older, you're leveling up! Happy Birthday, superstar! 🎮✨", cat: "funny" },
    { text: "Wishing you a day that's as special as the joy you bring to everyone around you. Happy Birthday!", cat: "heartfelt" },
    { text: "Cheers to you! 🥂 May this year bring you new adventures, beautiful memories, and endless happiness.", cat: "heartfelt" },
    { text: "Happy Birthday! 🎈", cat: "short" },
    { text: "Roses are red, violets are blue, you're getting older, but still looking good too! Happy Birthday!", cat: "funny" },
    { text: "A wish for you on your birthday: May life's best chapters yet be written, may your dreams take flight, and may your heart be light.", cat: "poetic" },
    { text: "You make the world a better place just by being in it. Happy Birthday to someone who truly deserves all the happiness!", cat: "heartfelt" },
    { text: "Happy Birthday! Hope your day is filled with cake, presents, and zero responsibilities!", cat: "funny" },
    { text: "Celebrate you! 🎉", cat: "short" },
    { text: "As you blow out the candles, may every wish find its way home. Happy Birthday, lovely soul!", cat: "poetic" },
    { text: "Sending you the biggest birthday hug and warmest wishes for the year ahead. You deserve the world!", cat: "heartfelt" },
    { text: "Age is just a number, but cake is forever. Happy Birthday! 🍰", cat: "funny" },
    { text: "Enjoy your day to the fullest!", cat: "short" },
    { text: "In the garden of life, you're the most beautiful flower. May your birthday bloom with joy and grace.", cat: "poetic" },
    { text: "To an incredible person: may your birthday be filled with the same warmth and kindness you show others every day.", cat: "heartfelt" },
    { text: "You're like a fine wine — you get better with age. Or maybe just more expensive. Either way, Happy Birthday! 🍷", cat: "funny" },
    { text: "Here's to you! 🥳", cat: "short" },
    { text: "The world is brighter because you're in it. Today, we celebrate the beautiful soul that you are. Happy Birthday!", cat: "poetic" },
    { text: "May your day be wrapped in joy, tied with love, and delivered with all the happiness in the world. Happy Birthday!", cat: "heartfelt" },
    { text: "Congratulations! You've successfully completed another trip around the sun. Try not to get dizzy! 🌍", cat: "funny" },
    { text: "Many happy returns! 🌟", cat: "short" },
    { text: "Another chapter begins. May it be filled with plot twists of joy, characters of love, and a happy ending.", cat: "poetic" },
    { text: "Thinking of you on your special day and wishing you all the happiness in the world. You deserve nothing but the best!", cat: "heartfelt" },
    { text: "You had me at 'birthday cake.' Happy Birthday! Let's eat! 🍰", cat: "funny" },
    { text: "Shine on! ✨", cat: "short" },
    { text: "To the one who makes life beautiful: may your birthday be as magnificent as the light you bring to others.", cat: "poetic" }
  ];

  function init() {
    renderMessages('all');
    bindCategories();
  }

  function renderMessages(category) {
    const grid = document.getElementById('messagesGrid');
    if (!grid) return;

    const filtered = category === 'all'
      ? messages
      : messages.filter(m => m.cat === category);

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="text-muted">No messages in this category</p>';
      return;
    }

    grid.innerHTML = filtered.map(m => `
      <div class="message-card" data-category="${m.cat}">
        <button class="msg-copy" title="Copy message"><i class="fas fa-copy"></i></button>
        <p>${m.text}</p>
        <span class="msg-category">${m.cat}</span>
      </div>
    `).join('');

    // Bind copy buttons
    grid.querySelectorAll('.msg-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.message-card');
        const text = card.querySelector('p').textContent;
        navigator.clipboard.writeText(text).then(() => {
          card.classList.add('copied');
          showToast('Wish copied!');
          setTimeout(() => card.classList.remove('copied'), 2000);
        }).catch(() => {
          // Fallback
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
          showToast('Wish copied!');
        });
      });
    });
  }

  function bindCategories() {
    document.querySelectorAll('.msg-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.msg-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMessages(btn.dataset.cat);
      });
    });
  }

  return { init };
})();
