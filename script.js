(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initTheme() {
    const button = $('#themeToggle');
    const label = $('#themeLabel');
    const themeMeta = $('meta[name="theme-color"]');
    if (!button) return;

    const current = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const render = (theme) => {
      document.documentElement.dataset.theme = theme;
      const next = theme === 'dark' ? 'light' : 'dark';
      if (label) label.textContent = next === 'dark' ? 'Dark' : 'Light';
      button.setAttribute('aria-label', `Switch to ${next} theme`);
      themeMeta?.setAttribute('content', theme === 'dark' ? '#101114' : '#f3f0e8');
    };

    render(current());
    button.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      render(next);
      try { localStorage.setItem('theme', next); } catch (_) {}
    });
  }

  function initNavigation() {
    const toggle = $('#navToggle');
    const nav = $('#siteNav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia('(min-width: 861px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  function initReveal() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -9% 0px',
      threshold: 0.08
    });

    elements.forEach((element, index) => {
      if (index < 4) element.classList.add('is-visible');
      else observer.observe(element);
    });
  }

  function initScrollProgress() {
    const bar = $('#scrollLine');
    if (!bar) return;

    let scheduled = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      scheduled = false;
    };

    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initLocalTime() {
    const time = $('[data-local-time]');
    if (!time) return;

    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    });
    const update = () => { time.textContent = formatter.format(new Date()); };
    update();
    window.setInterval(update, 60_000);
  }

  function initProjectFacts() {
    const toggles = $$('.project-facts-toggle');
    if (!toggles.length) return;

    const setOpen = (button, open) => {
      const card = button.closest('.project-card');
      const factsId = button.getAttribute('aria-controls');
      const facts = factsId ? document.getElementById(factsId) : null;

      card?.classList.toggle('is-facts-open', open);
      button.setAttribute('aria-expanded', String(open));
      facts?.setAttribute('aria-hidden', String(!open));
    };

    toggles.forEach((button) => {
      setOpen(button, false);
      button.addEventListener('click', () => {
        const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
        toggles.forEach((other) => {
          if (other !== button) setOpen(other, false);
        });
        setOpen(button, shouldOpen);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      toggles.forEach((button) => setOpen(button, false));
    });
  }

  function initYear() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  let enhancementReady = false;
  try {
    initNavigation();
    initReveal();
    initProjectFacts();
    enhancementReady = true;
  } catch (_) {
    // Keep the full page visible and the navigation expanded if enhancement fails.
  }

  if (enhancementReady) document.documentElement.classList.add('js-ready');

  [initTheme, initScrollProgress, initLocalTime, initYear].forEach((initializer) => {
    try { initializer(); } catch (_) {}
  });
})();
