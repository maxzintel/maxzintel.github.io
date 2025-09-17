(function () {
  'use strict';

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function initAOS(prefersReduced) {
    if (!window.AOS) return;
    AOS.init({
      duration: prefersReduced ? 0 : 700,
      easing: 'ease-out',
      once: true,
      disable: prefersReduced,
      offset: 80
    });
  }

  function initLenis(prefersReduced) {
    if (prefersReduced || !window.Lenis) return;
    var lenis = new Lenis({ smoothWheel: true, smoothTouch: false });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function initMobileNav() {
    var toggle = qs('.nav-toggle');
    var menu = qs('#primary-nav');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        var firstLink = qs('#primary-nav a');
        if (firstLink) firstLink.focus();
      }
    });
    // Close on link click (mobile UX)
    qsa('#primary-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      });
    });
    // ESC to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  function initStarfield() {
    var canvas = document.getElementById('starfield');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    var stop = false;

    function computeStarCount() {
      var base = (canvas.width * canvas.height) / (4000 * dpr);
      var maxCap = window.innerWidth < 600 ? 160 : 240;
      var minCap = 100;
      return Math.min(Math.max(Math.floor(base), minCap), maxCap);
    }

    function resizeCanvas() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      initStars();
    }

    function initStars() {
      stars.length = 0;
      var count = computeStarCount();
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * (1.6 * dpr) + (0.4 * dpr),
          vy: Math.random() * (0.3 * dpr) + (0.1 * dpr),
          a: Math.random() * 0.6 + 0.2
        });
      }
    }

    function drawOnce() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate() {
      if (stop) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y += s.vy;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      drawOnce();
    } else {
      animate();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop = true;
      } else {
        if (prefersReduced) { drawOnce(); return; }
        if (stop) { stop = false; requestAnimationFrame(animate); }
      }
    });
  }

  function initScanlineEffect() {
    try {
      var toggleButton = document.getElementById('scanline-toggle');
      var scanlineOverlay = document.getElementById('scanline-overlay');
      var toggleState = document.querySelector('.toggle-state');
      if (!toggleButton || !scanlineOverlay || !toggleState) {
        console.debug('Scanline elements not found; skipping');
        return;
      }

      var active = true; // default ON when no saved preference
      try {
        var stored = localStorage.getItem('scanlineActive');
        if (stored !== null) active = (stored === 'true');
      } catch (e) {}
      scanlineOverlay.classList.toggle('active', active);
      toggleState.textContent = active ? 'On' : 'Off';
      toggleButton.setAttribute('aria-pressed', String(active));

      toggleButton.addEventListener('click', function () {
        var isActive = scanlineOverlay.classList.toggle('active');
        toggleState.textContent = isActive ? 'On' : 'Off';
        try { localStorage.setItem('scanlineActive', String(isActive)); } catch (e) {}
        toggleButton.setAttribute('aria-pressed', String(isActive));
        if (typeof AudioController !== 'undefined' && AudioController.playSound) {
          AudioController.playSound('click');
        }
      });
    } catch (e) {
      console.debug('Scanline init error:', e);
    }
  }

  function initProjectModals() {
    var overlay = document.getElementById('project-modal');
    var content = document.getElementById('project-modal-content');
    var closeBtn = overlay ? overlay.querySelector('.modal-close') : null;
    if (!overlay || !content || !closeBtn) return;

    function openModal(projectKey) {
      var tpl = document.getElementById('template-project-' + projectKey);
      if (!tpl) return;
      content.innerHTML = '';
      content.appendChild(tpl.content.cloneNode(true));
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Open handlers for all Details buttons
    document.querySelectorAll('[data-project]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var key = btn.getAttribute('data-project');
        openModal(key);
      });
    });

    // Close handlers
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  }

  function initDynamicDaysCounters() {
    try {
      var nodes = document.querySelectorAll('.dynamic-days[data-days-from]');
      if (!nodes.length) return;
      nodes.forEach(function (el) {
        var from = el.getAttribute('data-days-from');
        var plus = el.getAttribute('data-plus') === 'true';
        var start = new Date(from + 'T00:00:00Z');
        if (isNaN(start)) return;
        var now = new Date();
        var diffMs = now - start;
        var days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        el.textContent = plus ? (days) : String(days);
      });
    } catch (e) { console.debug('dynamic days error', e); }
  }

  function initDynamicCoffeesCounter() {
    try {
      var el = document.querySelector('.dynamic-coffees');
      if (!el) return;
      var baseDateStr = el.getAttribute('data-base-date');
      var startStr = el.getAttribute('data-start');
      var perDayStr = el.getAttribute('data-per-day');
      var baseDate = new Date(baseDateStr + 'T00:00:00Z');
      var startCount = parseInt(startStr, 10);
      var perDay = parseInt(perDayStr, 10) || 3;
      if (isNaN(baseDate) || isNaN(startCount)) return;

      var now = new Date();
      var diffMs = now - baseDate;
      var days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      var total = startCount + (days * perDay);

      el.textContent = total.toLocaleString();
    } catch (e) { console.debug('dynamic coffees error', e); }
  }

  // Audio Controller
  var AudioController = (function () {
    var api = { init: init, toggleMute: toggleMute, playSound: playSound };
    var ambient = null;
    var clickSfx = null;
    var isMuted = true;
    var initialized = false;

    function init() {
      try {
        // Persisted preference (default muted)
        var stored = localStorage.getItem('audioMuted');
        isMuted = stored === null ? true : (stored === 'true');

        var toggleBtn = document.getElementById('audio-toggle');
        if (toggleBtn) {
          updateToggleClasses(toggleBtn);
          toggleBtn.addEventListener('click', function () {
            // First user gesture: lazy init sounds
            if (!initialized) lazyInit();
            // Always play click on toggle regardless of mute
            if (clickSfx) { try { clickSfx.play(); } catch (e) {} }
            toggleMute();
          });
        }

        // Prime on first user interaction anywhere
        document.addEventListener('pointerdown', primeOnce, { once: true, passive: true });
        document.addEventListener('keydown', primeOnce, { once: true });

        // Visibility handling
        document.addEventListener('visibilitychange', function () {
          if (!ambient) return;
          if (document.hidden) ambient.pause();
          else if (!isMuted) ambient.play();
        });
      } catch (e) { console.warn('Audio init error:', e); }
    }

    function primeOnce() { if (!initialized) lazyInit(); }

    function lazyInit() {
      initialized = true;
      if (typeof Howl === 'undefined') { console.warn('Howler not found; skipping audio'); return; }
      ambient = new Howl({ src: ['media/ambient-loop.mp3'], loop: true, volume: 0.25, autoplay: false });
      clickSfx = new Howl({ src: ['media/click.mp3'], volume: 0.4 });
      if (!isMuted) ambient.play();

      // Attach click sfx to buttons/CTA (exclude the audio toggle to avoid double sound)
      qsa('button:not(#audio-toggle), .cta-button').forEach(function (el) {
        el.addEventListener('click', function () { playSound('click'); });
      });
    }

    function toggleMute() {
      isMuted = !isMuted;
      localStorage.setItem('audioMuted', String(isMuted));
      var toggleBtn = document.getElementById('audio-toggle');
      if (toggleBtn) updateToggleClasses(toggleBtn);
      if (!ambient) return;
      if (isMuted) ambient.pause(); else ambient.play();
    }

    function updateToggleClasses(btn) {
      btn.classList.toggle('is-muted', isMuted);
      btn.classList.toggle('is-playing', !isMuted);
      btn.setAttribute('aria-pressed', String(!isMuted));
      btn.setAttribute('title', isMuted ? 'Enable audio' : 'Mute audio');
    }

    function playSound(kind) {
      if (isMuted) return;
      if (kind === 'click' && clickSfx) clickSfx.play();
    }

    return api;
  })();

  // Initialize controllers
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      initAOS(prefersReduced);
      initLenis(prefersReduced);
      initMobileNav();
      initStarfield();
      AudioController.init();
      initScanlineEffect();
      initProjectModals();
      initDynamicDaysCounters();
      initDynamicCoffeesCounter();

      var supportsCanvas = !!window.HTMLCanvasElement;
      var supportsCssSnap = CSS && CSS.supports && CSS.supports('scroll-snap-type: y mandatory');
      console.log('Feature detection:', { supportsCanvas: supportsCanvas, supportsCssSnap: supportsCssSnap });

    } catch (e) {
      console.warn('Initialization error:', e);
    }
  });
})();
