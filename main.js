/**
 * ReactiveTinnitus.org — main.js
 * Handles: wave canvas animation, scroll effects, nav, intersection observer
 */

/* =============================================
   1. WAVE CANVAS — Reactive Sound Wave Visual
   ============================================= */
(function initWaveCanvas() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animFrame;
  let time = 0;
  let stressed = false; // becomes true after a delay to simulate overstimulation

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Draws a sine wave with distortion layered in
  function drawWave(opts) {
    const {
      amplitude, frequency, speed, yOffset,
      color, lineWidth, distort, phase = 0
    } = opts;

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    for (let x = 0; x <= W; x += 2) {
      const progress = x / W;
      let distortion = 0;
      if (distort > 0) {
        // High-frequency noise in the middle — represents overload
        distortion = Math.sin(x * 0.08 + time * 5.1) * distort
                   * Math.sin(progress * Math.PI);
      }
      const y = H * yOffset
        + Math.sin(x * frequency + time * speed + phase) * amplitude
        + Math.sin(x * frequency * 2.3 + time * speed * 0.7 + phase) * (amplitude * 0.35)
        + distortion;

      if (x === 0) ctx.moveTo(x, y);
      else          ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Stress factor grows over 4s to simulate increasing overload
  let stressFactor = 0;
  let stressStart = null;

  function draw(timestamp) {
    if (!stressStart) stressStart = timestamp;
    const elapsed = (timestamp - stressStart) / 1000;
    stressFactor = Math.min(1, elapsed / 6); // ramp over 6 seconds

    ctx.clearRect(0, 0, W, H);

    // Base calm wave — teal
    drawWave({
      amplitude: 28 + stressFactor * 14,
      frequency: 0.008,
      speed: 0.6 + stressFactor * 0.5,
      yOffset: 0.45,
      color: `rgba(46, 196, 182, ${0.25 + stressFactor * 0.1})`,
      lineWidth: 1.5,
      distort: stressFactor * 18,
      phase: 0
    });

    // Secondary wave — slightly offset
    drawWave({
      amplitude: 18 + stressFactor * 22,
      frequency: 0.011,
      speed: 0.9 + stressFactor * 0.8,
      yOffset: 0.52,
      color: `rgba(46, 196, 182, ${0.14 + stressFactor * 0.08})`,
      lineWidth: 1,
      distort: stressFactor * 28,
      phase: 1.2
    });

    // Tertiary wave — amber, appears with stress
    if (stressFactor > 0.2) {
      const amberOpacity = (stressFactor - 0.2) * 0.5;
      drawWave({
        amplitude: 12 + stressFactor * 30,
        frequency: 0.014,
        speed: 1.3 + stressFactor * 1.2,
        yOffset: 0.48,
        color: `rgba(244, 169, 66, ${amberOpacity})`,
        lineWidth: 1,
        distort: stressFactor * 40,
        phase: 2.5
      });
    }

    // Red overload wave — only at high stress
    if (stressFactor > 0.6) {
      const redOpacity = (stressFactor - 0.6) * 0.4;
      drawWave({
        amplitude: 8 + stressFactor * 36,
        frequency: 0.018,
        speed: 2.1 + stressFactor * 1.5,
        yOffset: 0.50,
        color: `rgba(224, 85, 85, ${redOpacity})`,
        lineWidth: 0.8,
        distort: stressFactor * 55,
        phase: 4.1
      });
    }

    time += 0.016;
    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  animFrame = requestAnimationFrame(draw);
})();


/* =============================================
   2. STICKY HEADER on scroll
   ============================================= */
(function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
})();


/* =============================================
   3. MOBILE NAV TOGGLE
   ============================================= */
(function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';

    // Animate hamburger to X
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close on nav link click
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
})();


/* =============================================
   4. INTERSECTION OBSERVER — animate on scroll
   ============================================= */
(function initScrollAnimations() {
  const targets = document.querySelectorAll('[data-animate], .prose-block, .threshold-diagram, .col-block, .pull-quote, .resource-card, .cta-block');

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything
    targets.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(function (el) { observer.observe(el); });
})();


/* =============================================
   5. HIDE SCROLL HINT on scroll
   ============================================= */
(function initScrollHint() {
  const hint = document.getElementById('scrollHint');
  if (!hint) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 100) {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
    } else {
      hint.style.opacity = '';
      hint.style.pointerEvents = '';
    }
  }, { passive: true });
})();


/* =============================================
   6. THRESHOLD BARS — animate heights in
   ============================================= */
(function initThresholdBars() {
  const bars = document.querySelectorAll('.t-bar');
  if (!bars.length) return;

  // Store target heights, reset to 0 initially
  const targetHeights = [];
  bars.forEach(function (bar) {
    const h = bar.style.getPropertyValue('--h');
    targetHeights.push(h);
    bar.style.setProperty('--h', '0%');
  });

  const diagram = document.querySelector('.threshold-diagram');
  if (!diagram) return;

  const barObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Stagger bar animation
        bars.forEach(function (bar, i) {
          setTimeout(function () {
            bar.style.setProperty('--h', targetHeights[i]);
          }, i * 120);
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  barObserver.observe(diagram);
})();


/* =============================================
   7. SMOOTH ACTIVE NAV highlighting
   ============================================= */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  window.addEventListener('scroll', function () {
    let current = '';
    sections.forEach(function (section) {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.style.color = '';
      if (link.getAttribute('href') === '#' + current) {
        link.style.color = 'var(--teal)';
      }
    });
  }, { passive: true });
})();
