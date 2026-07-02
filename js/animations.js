// =============================================
// ANIMATIONS MODULE - Confetti, Balloons, GSAP
// =============================================
const Animations = (() => {
  let canvas, ctx, particles = [], animFrame, isRunning = false;
  let width, height;

  // Particle types
  const COLORS = ['#ff6b9d', '#c084fc', '#fbbf24', '#4facfe', '#43e97b', '#f5576c', '#ff9a9e', '#a8edea', '#ffd700'];

  function initCanvas() {
    canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // --- Particle Classes ---
  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height * -1;
      this.size = Math.random() * 8 + 4;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.speedY = Math.random() * 3 + 2;
      this.speedX = Math.random() * 2 - 1;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
      this.opacity = Math.random() * 0.5 + 0.5;
      this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
      this.rotation += this.rotationSpeed;
      if (this.y > height + 20) {
        this.y = -20;
        this.x = Math.random() * width;
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      if (this.shape === 'rect') {
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class BalloonParticle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = height + 50;
      this.size = Math.random() * 20 + 15;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.speedY = Math.random() * 1.5 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.swing = Math.random() * 2;
      this.swingSpeed = Math.random() * 0.02 + 0.01;
      this.phase = Math.random() * Math.PI * 2;
      this.stringLength = Math.random() * 30 + 20;
      this.pop = false;
      this.popProgress = 0;
    }
    update() {
      if (this.pop) {
        this.popProgress += 0.05;
        this.size *= 0.96;
        if (this.popProgress > 1) {
          this.reset();
          this.y = -50;
        }
        return;
      }
      this.y -= this.speedY;
      this.x += Math.sin(this.phase) * this.swing;
      this.phase += this.swingSpeed;
      if (this.y < -50) this.reset();
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.pop && this.popProgress < 1) {
        const s = 1 + Math.sin(this.popProgress * Math.PI) * 2;
        ctx.scale(s, s);
        ctx.globalAlpha = 1 - this.popProgress;
      }
      // Balloon body
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size / 2, this.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      // String
      if (!this.pop) {
        ctx.beginPath();
        ctx.moveTo(0, this.size * 0.5);
        ctx.quadraticCurveTo(4, this.size * 0.5 + this.stringLength * 0.5, Math.sin(this.phase * 2) * 3, this.size * 0.5 + this.stringLength);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  class StarParticle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 3 + 1;
      this.twinkle = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 0.02 + 0.01;
      this.opacity = Math.random() * 0.5 + 0.3;
    }
    update() {
      this.twinkle += this.speed;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity * (0.5 + 0.5 * Math.sin(this.twinkle));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- Burst Effect ---
  function burstEffect(x, y, color) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const p = new ConfettiParticle();
      p.x = x;
      p.y = y;
      p.color = color || COLORS[Math.floor(Math.random() * COLORS.length)];
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 6 + 3;
      p.speedX = Math.cos(angle) * speed;
      p.speedY = Math.sin(angle) * speed;
      p.size = Math.random() * 6 + 3;
      particles.push(p);
    }
  }

  // --- Heart Burst ---
  function heartBurst(x, y) {
    const heartEmojis = ['❤️', '💕', '💗', '💖', '💝'];
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        el.style.cssText = `
          position: fixed; pointer-events: none; z-index: 9999;
          font-size: ${Math.random() * 20 + 16}px;
          left: ${x + Math.random() * 60 - 30}px;
          top: ${y + Math.random() * 60 - 30}px;
          transform: translateY(0);
          transition: all ${1 + Math.random() * 0.5}s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translateY(-${80 + Math.random() * 120}px) scale(0.3)`;
          el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 2000);
      }, i * 80);
    }
  }

  // --- Main Animation Loop ---
  function animate() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    animFrame = requestAnimationFrame(animate);
  }

  // --- Public API ---
  function startConfetti(density = 80) {
    if (!ctx) initCanvas();
    isRunning = true;
    // Add confetti
    for (let i = 0; i < density; i++) {
      particles.push(new ConfettiParticle());
    }
    // Add some balloons
    for (let i = 0; i < 8; i++) {
      const b = new BalloonParticle();
      b.y = Math.random() * height;
      particles.push(b);
    }
    // Add stars if dark theme
    if (document.body.getAttribute('data-theme') === 'space' || !document.body.getAttribute('data-theme')) {
      for (let i = 0; i < 50; i++) {
        particles.push(new StarParticle());
      }
    }
    if (!animFrame) animate();
  }

  function stopConfetti() {
    isRunning = false;
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    particles = [];
    if (ctx) ctx.clearRect(0, 0, width, height);
  }

  function addBurst(x, y, color) {
    burstEffect(x, y, color);
    heartBurst(x, y);
  }

  function addBalloonPop(x, y) {
    // Find nearest balloon and pop it
    let nearest = null, minDist = Infinity;
    particles.forEach(p => {
      if (p instanceof BalloonParticle && !p.pop) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < minDist) { minDist = d; nearest = p; }
      }
    });
    if (nearest && minDist < 100) {
      nearest.pop = true;
      burstEffect(nearest.x, nearest.y, nearest.color);
    }
  }

  function init() {
    initCanvas();
    // Start subtle confetti
    startConfetti(40);
  }

  // --- GSAP Entrance Animations ---
  function animateEntrance() {
    if (typeof gsap === 'undefined') return;
    const sections = document.querySelectorAll('section:not(.comments-section)');
    sections.forEach((section, i) => {
      gsap.fromTo(section,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    });
    // Hero animations
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && gsap) {
      gsap.from('.hero-badge', { opacity: 0, y: -30, duration: 0.8, delay: 0.5 });
      gsap.from('.hero-title', { opacity: 0, y: 40, duration: 1, delay: 0.7 });
      gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8, delay: 0.9 });
      gsap.from('.hero-name-input', { opacity: 0, y: 20, duration: 0.8, delay: 1.1 });
      gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.8, delay: 1.3 });
    }
  }

  return {
    init,
    startConfetti,
    stopConfetti,
    addBurst,
    addBalloonPop,
    animateEntrance,
    heartBurst
  };
})();
