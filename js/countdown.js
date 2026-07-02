// =============================================
// COUNTDOWN TIMER MODULE
// =============================================
const Countdown = (() => {
  let targetDate = null;
  let interval = null;
  let notificationSent = false;
  const STORAGE_KEY = 'bw_birthday_date';

  function init() {
    loadDate();
    requestNotifPermission();
    const picker = document.getElementById('birthdayDatePicker');
    if (picker) {
      if (targetDate) picker.value = formatDateInput(targetDate);
      picker.addEventListener('change', () => {
        if (picker.value) {
          targetDate = new Date(picker.value + 'T00:00:00');
          // Set to next occurrence if past
          const now = new Date();
          targetDate.setFullYear(now.getFullYear());
          if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
          saveDate();
          startTimer();
        }
      });
    }
    startTimer();
  }

  function loadDate() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        targetDate = new Date(stored);
        if (isNaN(targetDate.getTime())) targetDate = null;
      }
    } catch { targetDate = null; }
    // Default: 30 days from now
    if (!targetDate) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
    }
    // Ensure future date (compare date only, not time)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    if (targetDay < todayStart) {
      targetDate.setFullYear(now.getFullYear() + 1);
    }
  }

  function saveDate() {
    try { localStorage.setItem(STORAGE_KEY, targetDate.toISOString()); } catch {}
  }

  function requestNotifPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      document.addEventListener('click', () => {
        Notification.requestPermission();
      }, { once: true });
    }
  }

  function sendBirthdayNotification() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('🎂 Happy Birthday!', {
        body: 'Today is the day! Wishing you a wonderful birthday!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎂</text></svg>'
      });
    }
  }

  function startTimer() {
    if (interval) clearInterval(interval);
    updateDisplay();
    interval = setInterval(updateDisplay, 1000);
  }

  function updateDisplay() {
    const daysEl = document.getElementById('countDays');
    if (!daysEl) return;
    const hoursEl = document.getElementById('countHours');
    const minsEl = document.getElementById('countMinutes');
    const secsEl = document.getElementById('countSeconds');
    const headerEl = document.querySelector('.countdown-section .section-header p');

    const now = new Date();
    let diff = targetDate - now;

    if (diff <= 0) {
      daysEl.textContent = '🎉';
      hoursEl.textContent = '🎉';
      minsEl.textContent = '🎉';
      secsEl.textContent = '🎉';
      if (headerEl) headerEl.textContent = 'Today is the day! Happy Birthday! 🎂';
      if (!notificationSent) {
        notificationSent = true;
        sendBirthdayNotification();
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(minutes).padStart(2, '0');
    secsEl.textContent = String(seconds).padStart(2, '0');
  }

  function setDate(dateStr) {
    targetDate = new Date(dateStr);
    const now = new Date();
    if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
    saveDate();
    const picker = document.getElementById('birthdayDatePicker');
    if (picker) picker.value = formatDateInput(targetDate);
    startTimer();
  }

  function getTargetDate() { return targetDate; }

  function formatDateInput(date) {
    return date.toISOString().split('T')[0];
  }

  return { init, setDate, getTargetDate };
})();
