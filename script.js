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

  function initSectionSpy() {
    const links = $$('#siteNav a[href^="#"]');
    if (!links.length) return;

    const targets = links
      .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
      .filter((entry) => entry.section);
    if (!targets.length) return;

    const header = $('.site-header');
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const offset = (header ? header.getBoundingClientRect().height : 0) + 24;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      // Geometry beats intersection ratios here: pick the last section whose top has
      // passed under the header, so a tall section stays current while it fills the screen.
      let current = null;
      for (const entry of targets) {
        if (entry.section.getBoundingClientRect().top <= offset) current = entry;
      }
      if (atBottom) current = targets[targets.length - 1];

      targets.forEach((entry) => {
        if (entry === current) entry.link.setAttribute('aria-current', 'true');
        else entry.link.removeAttribute('aria-current');
      });
    };

    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  async function initContributions() {
    const figure = $('#contrib');
    if (!figure) return;
    const grid = $('[data-contrib-grid]', figure);
    const total = $('[data-contrib-total]', figure);
    if (!grid || !total) return;

    let data;
    try {
      const res = await fetch('https://github-contributions-api.jogruber.de/v4/nicholaslasagna?y=last', { mode: 'cors' });
      if (!res.ok) return;
      data = await res.json();
    } catch (_) {
      return; // Leave the section hidden rather than showing an empty grid.
    }

    const days = Array.isArray(data?.contributions) ? data.contributions : [];
    const count = Number(data?.total?.lastYear);
    if (!days.length || !Number.isFinite(count)) return;

    // Pad the front so the first column starts on a Sunday and the columns read as weeks.
    const lead = new Date(days[0].date + 'T00:00:00').getDay();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < lead; i += 1) {
      const pad = document.createElement('span');
      pad.className = 'contrib-cell is-pad';
      fragment.appendChild(pad);
    }

    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    days.forEach((day) => {
      const cell = document.createElement('span');
      cell.className = 'contrib-cell';
      cell.dataset.lvl = String(Math.max(0, Math.min(4, Number(day.level) || 0)));
      const n = Number(day.count) || 0;
      cell.title = `${n} contribution${n === 1 ? '' : 's'} on ${fmt.format(new Date(day.date + 'T00:00:00Z'))}`;
      fragment.appendChild(cell);
    });

    grid.appendChild(fragment);
    total.textContent = count.toLocaleString();
    grid.setAttribute('aria-label',
      `${count.toLocaleString()} contributions in the last year, across ${days.filter((d) => Number(d.count) > 0).length} active days`);
    figure.hidden = false;
  }

  function initYear() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  let enhancementReady = false;
  try {
    initNavigation();
    initReveal();
    enhancementReady = true;
  } catch (_) {
    // Keep the full page visible and the navigation expanded if enhancement fails.
  }

  if (enhancementReady) document.documentElement.classList.add('js-ready');

  [initTheme, initScrollProgress, initLocalTime, initSectionSpy, initContributions, initYear].forEach((initializer) => {
    try { initializer(); } catch (_) {}
  });
})();
