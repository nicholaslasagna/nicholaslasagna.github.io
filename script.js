/* ==========================================================================
   Nicholas Lasagna — Portfolio JS
   Vanilla. No deps. Progressive enhancement throughout.
   ========================================================================== */

(() => {
  'use strict';

  /* -------- utils -------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const norm = s => (s ?? '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  const debounce = (fn, w = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), w); }; };
  const safeFocus = el => { if (!el) return; try { el.focus({ preventScroll: true }); } catch { el.focus(); } };

  /* -------- header height var -------- */
  function initHeaderHeight() {
    const h = $('header');
    if (!h) return;
    const set = () => {
      document.documentElement.style.setProperty('--header-h', `${Math.ceil(h.getBoundingClientRect().height)}px`);
    };
    set();
    window.addEventListener('resize', set, { passive: true });
  }

  /* -------- theme -------- */
  function initTheme() {
    const btn = $('#themeBtn');
    const sysTheme = () => window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
    const get = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
    const set = v => { try { localStorage.setItem('theme', v); } catch {} };

    const apply = t => {
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
      else document.documentElement.removeAttribute('data-theme');
      btn?.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
      btn?.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    };

    const stored = get();
    apply(stored || sysTheme());

    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (mq && !stored) {
      const onSys = () => apply(sysTheme());
      mq.addEventListener?.('change', onSys);
      mq.addListener?.(onSys);
    }

    btn?.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'light' ? 'dark' : 'light';
      apply(next); set(next);
      toast(`${next === 'dark' ? 'Dark' : 'Light'} mode`);
    });
  }

  /* -------- footer year -------- */
  function initYear() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* -------- local time (pinned to Berkeley / America/Los_Angeles) -------- */
  function initLocalTime() {
    const el = $('[data-local-time]');
    if (!el) return;

    const fmt = new Intl.DateTimeFormat([], {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/Los_Angeles',
    });

    const tick = () => {
      el.textContent = fmt.format(new Date()).replace(' ', '');
    };
    tick();
    setInterval(tick, 30 * 1000);
  }

  /* -------- cursor spotlight -------- */
  function initCursorGlow() {
    const glow = $('.cursor-glow');
    if (!glow) return;
    if (matchMedia('(pointer: coarse)').matches) return; // skip on touch
    if (reduceMotion()) return;

    let raf = 0, tx = 50, ty = 30, mx = 50, my = 30;
    const onMove = e => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    };
    const loop = () => {
      mx += (tx - mx) * 0.18;
      my += (ty - my) * 0.18;
      glow.style.setProperty('--mx', `${mx}%`);
      glow.style.setProperty('--my', `${my}%`);
      if (Math.abs(tx - mx) > 0.05 || Math.abs(ty - my) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseenter', () => glow.classList.add('on'));
    window.addEventListener('mouseleave', () => glow.classList.remove('on'));
    glow.classList.add('on');
  }

  /* -------- magnetic buttons (subtle) -------- */
  function initMagnetic() {
    if (reduceMotion()) return;
    if (matchMedia('(pointer: coarse)').matches) return;

    const targets = $$('.btn.primary.lg, .contact-cta');
    targets.forEach(el => {
      let raf = 0;
      const onMove = e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        const max = 6;
        const tx = clamp(x * 0.18, -max, max);
        const ty = clamp(y * 0.18, -max, max);
        if (!raf) raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${tx}px, ${ty}px)`;
          raf = 0;
        });
      };
      const reset = () => { el.style.transform = ''; };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', reset);
    });
  }

  /* -------- nav: smooth scroll w/ offset -------- */
  function initAnchorOffset() {
    const headerH = () => {
      const h = $('header');
      return h ? Math.ceil(h.getBoundingClientRect().height) : 0;
    };
    function scrollTo(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const y = window.scrollY + el.getBoundingClientRect().top - clamp(headerH() + 12, 0, 200);
      window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }

    document.addEventListener('click', e => {
      const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#') || href === '#') return;
      const [hash] = href.split('?');
      const id = hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', href);
      scrollTo(id);
    });

    window.addEventListener('load', () => {
      const raw = window.location.hash || '';
      const id = (raw.split('?')[0] || '').replace('#', '');
      if (id) scrollTo(id);
    });

    // expose
    window.__scrollToId = scrollTo;
  }

  /* -------- active section highlight -------- */
  function initActiveSection() {
    const links = $$('header nav a[href^="#"]');
    if (!links.length) return;
    const map = new Map();
    links.forEach(a => {
      const id = (a.getAttribute('href') || '').slice(1);
      if (id) map.set(id, a);
    });
    const sections = Array.from(map.keys()).map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const setCurrent = id => {
      for (const [k, link] of map.entries()) {
        if (k === id) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    };

    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setCurrent(visible.target.id);
    }, {
      threshold: [0.2, 0.4, 0.6],
      rootMargin: '-18% 0px -65% 0px',
    });
    sections.forEach(s => obs.observe(s));
  }

  /* ==========================================================================
     SCROLL LOCK — one manager, multiple reasons (nav, palette, case, terminal).
     Reason-counted so overlays never fight: the page only unlocks when the LAST
     reason is released. iOS-safe (position:fixed body) and shift-free (scrollbar
     compensation). Restores the exact scroll position on full unlock.
     ========================================================================== */
  const ScrollLock = (() => {
    const reasons = new Set();
    let scrollY = 0;
    const lock = (reason) => {
      if (!reason || reasons.has(reason)) return;
      const wasEmpty = reasons.size === 0;
      reasons.add(reason);
      if (!wasEmpty) return; // already locked by another reason
      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.top = `-${scrollY}px`;
      if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
      document.body.classList.add('is-scroll-locked');
    };
    const unlock = (reason) => {
      if (!reasons.has(reason)) return;
      reasons.delete(reason);
      if (reasons.size > 0) return; // other overlays still need the lock
      document.body.classList.remove('is-scroll-locked');
      document.body.style.top = '';
      document.body.style.paddingRight = '';
      // Restore instantly — `scroll-behavior: smooth` on <html> would otherwise
      // animate the page back into place when an overlay closes.
      try { window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' }); }
      catch { window.scrollTo(0, scrollY); }
    };
    return { lock, unlock, get active() { return reasons.size > 0; } };
  })();

  /* -------- mobile nav -------- */
  function initMobileNav() {
    const nav = document.getElementById('navMobile');
    if (!nav) return;
    const summary = nav.querySelector('summary');
    const panel = nav.querySelector('.nav-panel');

    const setOpen = open => {
      nav.open = open;
      summary?.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) ScrollLock.lock('nav'); else ScrollLock.unlock('nav');
    };

    nav.addEventListener('toggle', () => {
      const open = nav.open;
      summary?.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) ScrollLock.lock('nav'); else ScrollLock.unlock('nav');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.open) setOpen(false);
    });

    document.addEventListener('click', e => {
      if (!nav.open) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!summary?.contains(t) && !panel?.contains(t)) setOpen(false);
    });

    // Close panel when a link is clicked
    nav.addEventListener('click', e => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (a) setOpen(false);
    });

    const mq = window.matchMedia('(max-width: 940px)');
    const onMq = () => { if (!mq.matches && nav.open) setOpen(false); };
    mq.addEventListener?.('change', onMq);
    mq.addListener?.(onMq);
  }

  /* -------- projects filter + search -------- */
  function initProjects() {
    const chips = $$('.chip');
    const projects = $$('.project');
    const input = $('#projectSearch');
    const noResults = $('#noResults');
    if (!projects.length) return null;

    const items = projects.map(el => {
      const tags = norm(el.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
      const title = norm($('h3', el)?.textContent || '');
      const blob = `${title} ${tags.join(' ')} ${norm(el.textContent || '')}`.trim();
      return { el, tags, blob };
    });

    let filter = 'all';
    let query = '';

    const press = chipEl => {
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      chipEl?.setAttribute('aria-pressed', 'true');
    };
    const apply = ({ updateUrl = true } = {}) => {
      let visible = 0;
      for (const it of items) {
        const okFilter = filter === 'all' || it.tags.includes(filter);
        const okSearch = !query || it.blob.includes(query);
        const ok = okFilter && okSearch;
        it.el.style.display = ok ? '' : 'none';
        if (ok) visible++;
      }
      if (noResults) {
        noResults.hidden = visible !== 0;
      }
      if (updateUrl) {
        const params = new URLSearchParams();
        if (filter !== 'all') params.set('tag', filter);
        if (query) params.set('query', query);
        const q = params.toString();
        const cur = window.location.hash.split('?')[0] || '';
        const isProj = cur === '#projects' || !cur;
        if (isProj && (q || cur === '#projects')) {
          history.replaceState(null, '', q ? `#projects?${q}` : '#projects');
        }
      }
    };

    const setFilter = next => {
      filter = norm(next) || 'all';
      const target = chips.find(c => (c.getAttribute('data-filter') || 'all') === filter);
      press(target);
      apply();
    };
    const setQuery = q => { query = norm(q); apply(); };

    chips.forEach(c => c.addEventListener('click', () => setFilter(c.getAttribute('data-filter') || 'all')));

    if (input) {
      const onSearch = debounce(() => setQuery(input.value), 80);
      input.addEventListener('input', onSearch);
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; setQuery(''); input.blur(); }
      });
    }

    // Init from hash
    const hash = window.location.hash || '';
    if (hash.startsWith('#projects')) {
      const q = hash.split('?')[1] || '';
      const params = new URLSearchParams(q);
      setFilter(params.get('tag') || 'all');
      const queryVal = params.get('query') || '';
      if (input) {
        input.value = queryVal;
        setQuery(queryVal);
      } else {
        query = norm(queryVal);
        apply({ updateUrl: false });
      }
    } else {
      apply({ updateUrl: false });
    }

    return { setFilter, setQuery, focusSearch: () => input?.focus() };
  }

  /* -------- modal -------- */
  /* ==========================================================================
     CASE STUDIES — rich, structured engineering write-ups rendered from data.
     Each project opens a full-screen overlay: overview, architecture diagram,
     engineering challenges, performance, deployment, timeline, stack, links.
     ========================================================================== */
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const CASES = {
    realfiction: {
      title: 'RealFiction',
      subtitle: 'Distributed Multiplayer Server Infrastructure',
      role: 'Architect & Operator',
      timeline: '2023 → Live',
      status: 'Live in production',
      tag: 'Infrastructure',
      summary: 'A live, multi-node Java game backend on Oracle Cloud — proxy routing, persistent data, JVM tuning, and real on-call.',
      problem: `Operating a multiplayer game network means several moving parts have to stay correct and responsive at once — proxy routing, multiple authoritative server processes, a database, and a cache — while real players are connected and any mistake is immediately visible.`,
      constraints: [
        `A single small cloud tenancy (Oracle Cloud, free-tier-class resources): CPU and memory budgets are real, so tuning matters more than scaling out.`,
        `Region-threaded server runtimes (Folia / Purpur) forbid touching world state from arbitrary threads.`,
        `User-facing uptime — changes have to be reversible because players notice downtime instantly.`
      ],
      tradeoffs: [
        { decision: `Tune a few nodes hard instead of scaling horizontally`, why: `Inside one tenancy, careful JVM/GC and server-config tuning buys more headroom than machines I don't have.` },
        { decision: `Velocity proxy in front of separate server processes`, why: `Isolating lobby / SMP / arcade as their own JVMs contains failures and lets one node restart without dropping the network — at the cost of cross-node state needing Redis.` },
        { decision: `Folia region-threading over a simpler single-threaded server`, why: `More concurrency headroom, but it forces region-safe code and rules out convenient-but-unsafe plugin patterns.` }
      ],
      outcome: [
        `A network that stays up across restarts and deploys, with node failures contained rather than global.`,
        `A repeatable deploy + rollback workflow so config changes don't gamble uptime.`,
        `Real experience debugging concurrency and routing issues under live, player-facing conditions.`
      ],
      proves: [
        `I can stand up and operate real cloud infrastructure on Linux — not just write application code.`,
        `I treat concurrency, failure isolation, and tail latency as first-order concerns.`
      ],
      overview: [
        'RealFiction is a distributed multiplayer server platform I architected, deployed, and operate on Oracle Cloud Infrastructure (OCI) running Ubuntu Linux. It serves concurrent real-time multiplayer workloads with high availability and low latency.',
        'The interesting engineering is not the game — it is the seam between distributed services and a JVM runtime under real player load. A request fans out across a proxy, multiple authoritative server nodes, a relational store, and a cache, and every hop is a place tail latency can hide.'
      ],
      arch: {
        caption: 'Request path: edge → proxy → authoritative nodes → persistence, with monitoring out-of-band.',
        tiers: [
          { label: 'Edge', nodes: [{ name: 'Players', note: 'concurrent clients' }, { name: 'Cloudflare', note: 'DNS · edge' }] },
          { label: 'Gateway', nodes: [{ name: 'Velocity Proxy', note: 'routing · auth handoff', primary: true }] },
          { label: 'Compute · OCI / Ubuntu', nodes: [{ name: 'Lobby', note: 'Java · Folia' }, { name: 'SMP', note: 'Java · Purpur' }, { name: 'Arcade', note: 'Java' }, { name: 'Anarchy', note: 'Java' }] },
          { label: 'State', nodes: [{ name: 'MariaDB', note: 'persistent player data' }, { name: 'Redis', note: 'cache · cross-node state' }] },
          { label: 'Ops', nodes: [{ name: 'Monitoring', note: 'process · latency' }, { name: 'Deploy pipeline', note: 'known-good baseline' }] }
        ]
      },
      challenges: [
        { problem: 'Region-threaded runtime (Folia) makes naive world access a crash, not a warning.', approach: 'Refactored plugin/service code to be region-safe — schedule work onto the owning region instead of touching shared state from arbitrary threads.', outcome: 'Eliminated a whole class of async world-access violations that only surfaced under load.' },
        { problem: 'Tail latency spikes were invisible in averages.', approach: 'Treated p99, not mean, as the player-experience KPI; tuned JVM garbage collection and chunk/database pipelines around it.', outcome: 'Smoother frame pacing under concurrency; spikes became diagnosable instead of anecdotal.' },
        { problem: 'A bad deploy on a live service is a felt outage.', approach: 'Every change ships behind a known-good baseline that can be restored in one command.', outcome: 'Confidence to iterate on production without gambling uptime.' }
      ],
      performance: [
        'JVM GC tuning targeting pause-time predictability over raw throughput.',
        'Redis as a cross-node cache to keep hot reads off the relational store.',
        'Proxy-level routing so node restarts do not drop the whole network.'
      ],
      deployment: [
        'Oracle Cloud Infrastructure (OCI) compute, Ubuntu Linux, managed by systemd-style service supervision.',
        'Reverse proxy + DNS via Cloudflare; per-node configuration kept under version control.',
        'Rollback to a known-good baseline as a first-class operation, not an afterthought.'
      ],
      stack: {
        Languages: ['Java'],
        'Infrastructure': ['Oracle Cloud (OCI)', 'Ubuntu Linux', 'Cloudflare', 'Docker'],
        'Runtime & data': ['Velocity', 'Folia / Purpur', 'MariaDB', 'Redis', 'JVM tuning']
      },
      links: [
        { label: 'Visit realfiction.live', url: 'https://realfiction.live', primary: true },
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna' }
      ]
    },

    hearthaven: {
      title: 'HeartHaven',
      subtitle: 'Real-time Multiplayer Web Platform',
      role: 'Full-stack Engineer',
      timeline: '2025 → In development',
      status: 'In active development',
      tag: 'Platform',
      summary: 'Not a website — a multiplayer application platform: live presence, companions, room decorating, and gardening, all cloud-persisted.',
      problem: `A real-time multiplayer space means many clients mutate shared, persistent state at once. The hard part isn't drawing the world — it's keeping every client consistent while never trusting the client as the source of truth.`,
      constraints: [
        `Browser-only client (no native process) — rendering and networking both run in the page.`,
        `Anyone can call the backend directly, so authorization has to live at the database, not just the UI.`,
        `Rewards and state changes must be server-validated; a forged request can't grant itself anything.`
      ],
      tradeoffs: [
        { decision: `Optimistic local updates, reconciled against Postgres`, why: `Actions feel instant, but it means writing reconciliation so authoritative server state always wins on conflict.` },
        { decision: `Row-Level Security as the enforcement boundary`, why: `Security lives in the database where it can't be bypassed — at the cost of carefully designed policies per table.` },
        { decision: `Phaser for the world + React/Next for the app shell`, why: `Best tool for each layer, but it needs a typed, one-directional bridge so the render loop and React state don't fight.` }
      ],
      outcome: [
        `Live rooms where presence and shared state stay in sync across clients.`,
        `A security model where reads and writes are constrained per-user at the data layer.`,
        `Server-validated rewards and state so the client is never the authority.`
      ],
      proves: [
        `I can design a full-stack real-time system with a credible security model — not a CRUD app.`,
        `I reason about trust boundaries and data consistency, not just features.`
      ],
      overview: [
        'HeartHaven is a real-time multiplayer web platform where players share a living space: a companion system, room decorating, gardening, and social interaction, all synchronized live and persisted to the cloud.',
        'The architecture problem is keeping many clients consistent in real time while every player mutates shared, persistent state — and doing it with browser-native rendering rather than a native client.'
      ],
      arch: {
        caption: 'Next.js + Phaser render the world; Supabase provides auth, realtime channels, and a row-level-secured Postgres.',
        tiers: [
          { label: 'Client', nodes: [{ name: 'Next.js', note: 'app shell · routing' }, { name: 'Phaser', note: 'canvas world · render loop', primary: true }, { name: 'TypeScript', note: 'typed state bridge' }] },
          { label: 'Realtime', nodes: [{ name: 'Supabase Realtime', note: 'presence · broadcast', primary: true }] },
          { label: 'Backend', nodes: [{ name: 'Supabase Auth', note: 'sessions' }, { name: 'Postgres', note: 'authoritative state' }, { name: 'Row-Level Security', note: 'per-user policies' }] },
          { label: 'Domain tables', nodes: [{ name: 'players' }, { name: 'rooms' }, { name: 'gardens' }, { name: 'companions' }, { name: 'inventory' }] }
        ]
      },
      challenges: [
        { problem: 'Live multiplayer state diverges the moment two clients act at once.', approach: 'Optimistic local updates reconciled against authoritative Postgres, with Supabase Realtime presence + broadcast keeping a room in sync.', outcome: 'Edits feel instant locally while the server stays the source of truth.' },
        { problem: 'Phaser owns a render loop; React owns the DOM. They must not fight.', approach: 'A typed state bridge: React/Next manages app state and auth, Phaser subscribes to a normalized store and renders — one direction of truth.', outcome: 'No tearing between UI chrome and the canvas world.' },
        { problem: 'Persistent shared state is a security surface — anyone can call the API.', approach: 'Row-Level Security policies enforce per-user access at the database, not just in the client; writes are validated server-side.', outcome: 'Least-privilege by construction: a forged request cannot read or write another player’s data.' }
      ],
      performance: [
        'Debounced persistence so decorating/gardening edits batch instead of hammering the DB.',
        'Realtime channels partitioned per room to bound fan-out.',
        'Optimistic UI to hide round-trip latency on common actions.'
      ],
      deployment: [
        'Next.js app deployed on managed edge hosting; Supabase-managed Postgres + Auth + Realtime.',
        'Environment-scoped secrets; RLS policies versioned alongside schema migrations.'
      ],
      stack: {
        Languages: ['TypeScript', 'SQL'],
        Frontend: ['Next.js', 'Phaser', 'React'],
        Backend: ['Supabase', 'PostgreSQL', 'Row-Level Security', 'Realtime']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    },

    reallang: {
      title: 'RealLang',
      subtitle: 'An AI-native Programming Language',
      role: 'Language & Compiler Engineer',
      timeline: '2025 → R&D',
      status: 'Research / in development',
      tag: 'Compilers',
      summary: 'A language designed to be generated and repaired reliably by LLMs: deterministic syntax, structured repairable diagnostics, C-backed execution.',
      problem: `Code an LLM generates is only useful if it's reliably correct and fixable. A language whose errors are vague prose and whose syntax has many equivalent spellings makes that hard. RealLang asks what a language looks like when reliable generation and repair are the design goal.`,
      constraints: [
        `Generated programs have to actually run, so the compiler must be correct — not a sketch.`,
        `Diagnostics need to be machine-applicable (structured), not just human-readable text.`,
        `Syntax should be deterministic enough that the same intent yields the same code.`
      ],
      tradeoffs: [
        { decision: `Lower to C instead of building a native backend`, why: `Leans on a mature, portable toolchain for real execution and lets me validate the generated C — at the cost of a C dependency in the pipeline.` },
        { decision: `Deterministic syntax + a canonical formatter`, why: `Shrinks the model's decision space and keeps diffs meaningful, trading some human-friendly flexibility for repeatability.` },
        { decision: `Hand-written recursive-descent front end`, why: `Full control over error recovery and structured diagnostics, at the cost of more code than a generated parser.` }
      ],
      outcome: [
        `A working front-to-back pipeline: source → lexer → parser → typecheck → C codegen.`,
        `Structured diagnostics designed to be applied as fixes, not just printed.`,
        `Generated C that can be validated, hardening the compiler against silently-wrong output.`
      ],
      proves: [
        `I can build a real compiler end to end and reason about correctness — not just use one.`,
        `I can take an ambitious systems idea and make it concrete and testable.`
      ],
      overview: [
        'RealLang is a programming language designed around a specific question: what would a language look like if its primary author were a model, not a human? The goal is reliable generation and automatic repair.',
        'Three ideas drive the design. Deterministic syntax: one canonical way to express a construct, so a model is not forced to choose between equivalent spellings. Repairable diagnostics: errors carry structured, machine-applicable fixes instead of prose. C-backed execution: the language lowers to C for predictable, native performance.'
      ],
      arch: {
        caption: 'A classic front-end pipeline with a repair loop: diagnostics are structured so a tool or model can apply fixes and re-run.',
        tiers: [
          { label: 'Source', nodes: [{ name: 'RealLang source', note: 'deterministic syntax' }] },
          { label: 'Front end', nodes: [{ name: 'Lexer', note: 'tokens' }, { name: 'Parser', note: 'recursive descent', primary: true }, { name: 'AST', note: 'typed tree' }] },
          { label: 'Diagnostics', nodes: [{ name: 'Repairable diagnostics', note: 'structured fixes', primary: true }, { name: 'Repair loop', note: 'apply → re-check' }] },
          { label: 'Back end', nodes: [{ name: 'Codegen', note: 'lower to C' }, { name: 'C compiler', note: 'native binary' }] }
        ]
      },
      challenges: [
        { problem: 'Ambiguous grammars make model output unstable — many spellings, same meaning.', approach: 'Designed a deterministic syntax with a single canonical form and a canonical formatter, shrinking the decision space the model has to navigate.', outcome: 'Generation becomes more repeatable; diffs stay meaningful.' },
        { problem: 'Traditional compiler errors are written for humans, not machines.', approach: 'Diagnostics are emitted as structured records — location, cause, and a suggested edit — so tooling (or an LLM) can apply a fix programmatically.', outcome: 'Errors become a repair API, not a dead end.' },
        { problem: 'A new language with no runtime is a toy.', approach: 'Lower to C and lean on a mature C toolchain for execution, so programs run as predictable native binaries.', outcome: 'Real performance and portability without building a backend from scratch.' }
      ],
      performance: [
        'C-backed lowering: execution is native, not interpreted.',
        'Recursive-descent parser with explicit error recovery to keep diagnostics flowing after the first mistake.'
      ],
      deployment: [],
      stack: {
        Languages: ['Rust', 'C'],
        'Compiler': ['Lexer', 'Recursive-descent parser', 'AST', 'Type checking', 'Codegen'],
        'Research': ['LLM reliability', 'Structured diagnostics', 'Deterministic syntax']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    },

    unitedexams: {
      title: 'UnitedExams',
      subtitle: 'Full-stack Educational Platform',
      role: 'Full-stack Engineer',
      timeline: '2025',
      status: 'Built',
      tag: 'Platform',
      summary: 'A practice-and-progress platform: adaptive practice, course organization, accounts, and a secure, row-level-secured backend.',
      problem: `A study platform is only trustworthy if each user's data is truly their own and the flows hold up — sign-in, attempts, progress, and a leaderboard all touch the same data with different visibility rules.`,
      constraints: [
        `Per-user data isolation is mandatory — one account must never read another's attempts or settings.`,
        `Auth has to gate protected routes, and the database has to enforce access independently of the UI.`,
        `A leaderboard needs shared visibility while everything else stays private.`
      ],
      tradeoffs: [
        { decision: `Supabase Auth + Postgres RLS over hand-rolled auth`, why: `Proven primitives and database-enforced access, at the cost of designing policies carefully per table.` },
        { decision: `Server / database as the source of truth for progress and mastery`, why: `Keeps the client from being trusted with its own scores, at the cost of more backend modeling.` }
      ],
      outcome: [
        `A complete product surface: auth, protected routes, quiz attempts, mastery / streaks, leaderboard, profile, and account settings.`,
        `Per-user data ownership enforced at the database via Row-Level Security.`
      ],
      proves: [
        `I can ship a complete, secure full-stack product — not just isolated features.`,
        `I treat authorization and data ownership as core architecture.`
      ],
      overview: [
        'UnitedExams is a full-stack educational platform for structured practice: organized courses, practice systems, progress tracking, and user accounts on a secure backend.',
        'The backend is the product. Content organization, progress modeling, and adaptive selection all live behind authenticated, row-level-secured APIs so a user only ever sees their own state.'
      ],
      arch: {
        caption: 'Next.js front end over a Supabase backend; adaptive selection reads mastery to choose the next item.',
        tiers: [
          { label: 'Client', nodes: [{ name: 'Next.js', note: 'app router' }, { name: 'TypeScript', note: 'typed UI' }] },
          { label: 'Backend', nodes: [{ name: 'Supabase Auth', note: 'accounts' }, { name: 'Postgres', note: 'courses · attempts · progress', primary: true }, { name: 'RLS', note: 'per-user policies' }] },
          { label: 'Logic', nodes: [{ name: 'Adaptive selection', note: 'next item by mastery', primary: true }, { name: 'Progress tracking', note: 'streaks · mastery' }] }
        ]
      },
      challenges: [
        { problem: 'Practice is only useful if it adapts to the learner.', approach: 'Model per-topic mastery and select the next item from weak areas instead of a fixed sequence.', outcome: 'Practice targets gaps rather than re-drilling what is already known.' },
        { problem: 'Educational data is per-user and sensitive.', approach: 'Row-Level Security enforces ownership at the database; protected routes guard the app surface.', outcome: 'A request can only ever touch the requesting user’s rows.' }
      ],
      performance: [
        'Indexed queries for attempt history and progress lookups.',
        'Server-validated writes to keep the client from being the source of truth.'
      ],
      deployment: [
        'Next.js on managed hosting; Supabase-managed Postgres + Auth.',
        'Schema, policies, and migrations kept together and versioned.'
      ],
      stack: {
        Languages: ['TypeScript', 'SQL'],
        Frontend: ['Next.js', 'React'],
        Backend: ['Supabase', 'PostgreSQL', 'Row-Level Security']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    },

    rust: {
      title: 'Rust Runtime Tooling',
      subtitle: 'Memory-safe systems for a live community',
      role: 'Systems Engineer',
      timeline: '2024 → Active',
      status: 'Active',
      tag: 'Systems',
      summary: 'Performance-sensitive runtime tooling in Rust for a large modding project — memory safety and concurrency where being wrong hurts someone else’s machine.',
      problem: `Tooling that runs close to a host process on other people's machines can't afford undefined behavior. The work is making low-level runtime interaction safe, explicit, and debuggable in a non-commercial modding context.`,
      constraints: [
        `Runs in environments I don't control, so failure has to be explicit — never silent corruption.`,
        `Low-level boundaries with a host runtime: memory and lifetime mistakes are unacceptable.`,
        `Non-commercial, community context — robustness and clarity matter more than feature count.`
      ],
      tradeoffs: [
        { decision: `Rust over C / C++ for the runtime layer`, why: `The type system rules out whole classes of memory and concurrency bugs up front, at the cost of more deliberate design around boundaries.` },
        { decision: `Fail loudly in dev, degrade gracefully in prod`, why: `Surfaces problems to me during development while staying recoverable for users, at the cost of extra error-handling plumbing.` }
      ],
      outcome: [
        `Runtime tooling with explicit failure handling and safer boundaries than the C-style norm in this space.`,
        `Hands-on debugging of concurrent, systems-level behavior.`
      ],
      proves: [
        `I work comfortably at the systems level and choose tools for correctness, not familiarity.`,
        `I take ownership of reliability in code that runs unsupervised.`
      ],
      overview: [
        'Performance-sensitive runtime tooling written in Rust for a large-scale game modification project with active community usage. The work lives at the low level: concurrent execution and systems-level resource management.',
        'Rust over C++ was a deliberate call. This code runs close to a host process on machines I do not control, so memory safety and runtime correctness are preconditions, not features — the type system pays for itself in tooling that has to run unsupervised.'
      ],
      arch: {
        caption: 'Tooling sits between user input and the host runtime, with explicit, debuggable boundaries.',
        tiers: [
          { label: 'Input', nodes: [{ name: 'Community config', note: 'untrusted' }] },
          { label: 'Tooling (Rust)', nodes: [{ name: 'Validation', note: 'fail loudly in dev' }, { name: 'Runtime layer', note: 'memory-safe', primary: true }, { name: 'Error handling', note: 'no silent fallbacks' }] },
          { label: 'Host', nodes: [{ name: 'Game runtime', note: 'host process' }] }
        ]
      },
      challenges: [
        { problem: 'Concurrency bugs in unsafe code corrupt a stranger’s session.', approach: 'Used Rust’s ownership model to make data races a compile error, and kept failure handling explicit.', outcome: 'Whole categories of memory and concurrency faults ruled out before shipping.' },
        { problem: 'Tooling that fails silently is worse than tooling that crashes.', approach: 'Designed to fail loudly in development and degrade gracefully in production.', outcome: 'Problems are visible to me, not mysterious to users.' }
      ],
      performance: [],
      deployment: [],
      stack: {
        Languages: ['Rust'],
        Focus: ['Memory safety', 'Concurrency', 'Low-level systems', 'Runtime debugging']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    },

    realchat: {
      title: 'RealChat',
      subtitle: 'High-performance Python Automation System',
      role: 'Engineer',
      timeline: '2023',
      status: 'Built',
      tag: 'Tools',
      summary: 'Event-driven desktop automation with OCR pipelines, AI-assisted workflows, encrypted licensing, and safe OS interaction.',
      problem: `Driving a desktop UI from what's on screen is unreliable by nature — OCR is noisy, layouts shift, and automation that acts on a wrong reading is dangerous. The work is making screen-driven automation predictable and safe.`,
      constraints: [
        `OCR input is imperfect; the system has to tolerate noise and ambiguous UI states.`,
        `Automation touches the real OS, so actions need guardrails before anything is dispatched.`,
        `Ships as a real desktop app — packaging, local config, and licensing all have to be handled.`
      ],
      tradeoffs: [
        { decision: `Tolerant parsing over exact string / pixel matching`, why: `Holds up across inconsistent screens, at the cost of more careful interpretation logic.` },
        { decision: `Guarded, validated automation steps`, why: `Predictable and recoverable behavior, at the cost of speed — it checks before it acts.` }
      ],
      outcome: [
        `Reliable behavior across noisy OCR and shifting layouts.`,
        `macOS packaging with encrypted local config, license / config handling, and hotkeys.`
      ],
      proves: [
        `I can ship a real, packaged desktop tool and design for failure — not just the happy path.`
      ],
      overview: [
        'RealChat is a high-performance Python desktop automation system integrating OCR pipelines and AI-assisted workflows: screen capture, text parsing, decision logic, and system-level automation — built for runtime safety.',
        'It ships as a real product, with an encrypted licensing and authentication layer handling secure environment variables and runtime validation.'
      ],
      arch: {
        caption: 'An event-driven loop: capture → recognize → decide → act, with safety checks before any OS interaction.',
        tiers: [
          { label: 'Capture', nodes: [{ name: 'Screen capture', note: 'regions' }, { name: 'OCR (Tesseract)', note: 'text extraction', primary: true }] },
          { label: 'Decide', nodes: [{ name: 'Parsing', note: 'noise filtering' }, { name: 'Decision matrix', note: 'AI-assisted' }] },
          { label: 'Act', nodes: [{ name: 'Safety checks', note: 'validate first', primary: true }, { name: 'OS automation', note: 'input dispatch' }] },
          { label: 'Cross-cutting', nodes: [{ name: 'Encrypted licensing', note: 'secrets · validation' }] }
        ]
      },
      challenges: [
        { problem: 'OCR on real screens is noisy and layouts shift.', approach: 'Robust filtering and tolerant parsing instead of brittle pixel/exact-string matching.', outcome: 'Predictable behavior across inconsistent UI states.' },
        { problem: 'Automating OS input is dangerous if it fires blindly.', approach: 'Safety checks gate every dispatch; the loop is event-driven and testable.', outcome: 'Automation stays predictable and recoverable.' }
      ],
      performance: ['Low-latency execution path with robust error handling around OS interaction.'],
      deployment: ['Packaged for macOS with app bundling, encrypted local config, and license-key validation.'],
      stack: {
        Languages: ['Python'],
        Focus: ['OCR / Tesseract', 'Event-driven systems', 'Automation', 'Encrypted licensing']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    },

    imagicast: {
      title: 'Imagicast Studios',
      subtitle: 'Independent Game Studio — Engine & Systems',
      role: 'Co-founder & Lead Developer',
      timeline: '2021 → Present',
      status: 'Active',
      tag: 'Games',
      summary: 'Co-founded a studio; lead engine-level systems across two titles — Abandoned Horror (6v1v1 multiplayer horror) and Heroic Submission.',
      problem: `Building original games over multiple years with a small distributed team means the engineering has to stay maintainable as scope grows — gameplay systems, engine-level code, and collaboration all have to hold together.`,
      constraints: [
        `A long-lived, multi-year codebase — maintainability compounds over time.`,
        `Distributed collaborators — source control and clear ownership are essential.`,
        `Engine-level work in UE4 / UE5 across original IP, not tutorials.`
      ],
      tradeoffs: [
        { decision: `Invest in reusable gameplay systems early`, why: `Pays off across a multi-year project, at the cost of slower initial feature delivery.` },
        { decision: `Git-based workflow with reviews for a small team`, why: `Keeps a distributed team's code coherent, at the cost of process overhead.` }
      ],
      outcome: [
        `Multi-year ownership of engine-level gameplay systems across two original titles.`,
        `A maintainable, source-controlled codebase shared across a distributed team.`
      ],
      proves: [
        `I can own real systems over the long haul and keep code maintainable as it grows.`,
        `I've shipped engineering in C++ / C# inside a serious engine, with team discipline.`
      ],
      overview: [
        'I co-founded Imagicast Studios in 2021 and lead development across its titles. The flagship, Abandoned Horror, is an asymmetrical multiplayer horror game built around a 6v1v1 gameplay loop; Heroic Submission is a second original IP in development.',
        'My work is the engineering spine: core systems architecture from initial design through production deployment — state management, input handling, and runtime multiplayer logic in Unreal Engine 4/5.'
      ],
      arch: {
        caption: 'Engine-level systems beneath gameplay: authoritative state, input, and replicated multiplayer logic.',
        tiers: [
          { label: 'Engine', nodes: [{ name: 'Unreal Engine 4/5', note: 'C++ · C#' }] },
          { label: 'Core systems', nodes: [{ name: 'State management', note: 'authoritative', primary: true }, { name: 'Input handling', note: 'buffered' }, { name: 'Gameplay systems', note: 'roles · rules' }] },
          { label: 'Multiplayer', nodes: [{ name: 'Runtime replication', note: '6v1v1 loop', primary: true }] }
        ]
      },
      challenges: [
        { problem: 'Asymmetrical 6v1v1 design means every role needs distinct, balanced systems.', approach: 'Designed and implemented distinctive roles within one shared, authoritative gameplay loop.', outcome: 'A coherent multiplayer experience instead of bolted-on mechanics.' },
        { problem: 'A multi-year project with a distributed team rots without discipline.', approach: 'Git-based workflows and iterative practices, balancing technical correctness, maintainability, and feature delivery.', outcome: 'Sustained development from prototype toward production.' }
      ],
      performance: [],
      deployment: [],
      stack: {
        Languages: ['C++', 'C#'],
        Engine: ['Unreal Engine 4/5'],
        Focus: ['Multiplayer systems', 'State management', 'Gameplay architecture']
      },
      links: [
        { label: 'GitHub', url: 'https://github.com/nicholaslasagna', primary: true }
      ]
    }
  };

  function renderArch(arch) {
    if (!arch || !Array.isArray(arch.tiers) || !arch.tiers.length) return '';
    const tiers = arch.tiers.map((tier, i) => {
      const nodes = tier.nodes.map(n => `
        <div class="arch-node${n.primary ? ' is-primary' : ''}">
          <strong>${esc(n.name)}</strong>${n.note ? `<span>${esc(n.note)}</span>` : ''}
        </div>`).join('');
      const arrow = i < arch.tiers.length - 1
        ? `<div class="arch-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 4v16M6 14l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
        : '';
      return `
        <div class="arch-tier">
          <span class="arch-tier-label mono">${esc(tier.label)}</span>
          <div class="arch-nodes">${nodes}</div>
        </div>${arrow}`;
    }).join('');
    return `
      <div class="arch" role="img" aria-label="Architecture diagram">${tiers}</div>
      ${arch.caption ? `<p class="arch-caption mono dim">${esc(arch.caption)}</p>` : ''}`;
  }

  function renderCase(d) {
    /* ---- shared section renderers (return inner HTML only) ---- */
    const paras = (arr) => (arr || []).map(p => `<p>${esc(p)}</p>`).join('');
    const lead = (s) => `<p class="case-lead">${esc(s)}</p>`;
    const bullets = (arr) => `<ul class="case-bullets">${(arr || []).map(b => `<li><span class="mono">→</span> ${esc(b)}</li>`).join('')}</ul>`;

    const challengesInner = (arr) => `
      <div class="challenges">
        ${arr.map((c, i) => `
          <div class="challenge">
            <span class="challenge-n mono">${String(i + 1).padStart(2, '0')}</span>
            <div class="challenge-body">
              <div class="challenge-row"><span class="challenge-k mono">Problem</span><p>${esc(c.problem)}</p></div>
              <div class="challenge-row"><span class="challenge-k mono">Approach</span><p>${esc(c.approach)}</p></div>
              <div class="challenge-row"><span class="challenge-k mono">Outcome</span><p>${esc(c.outcome)}</p></div>
            </div>
          </div>`).join('')}
      </div>`;

    const tradeoffsInner = (arr) => `
      <div class="tradeoffs">
        ${arr.map(t => `
          <div class="tradeoff">
            <span class="tradeoff-mark mono" aria-hidden="true">⇄</span>
            <div>
              <div class="tradeoff-decision">${esc(t.decision)}</div>
              <p>${esc(t.why)}</p>
            </div>
          </div>`).join('')}
      </div>`;

    const stackInner = (stack) => `
      <div class="case-stack">
        ${Object.entries(stack).map(([group, items]) => `
          <div class="case-stack-group">
            <span class="mono uppercase tiny dim">${esc(group)}</span>
            <div class="case-stack-chips">${items.map(t => `<span class="chip-static">${esc(t)}</span>`).join('')}</div>
          </div>`).join('')}
      </div>`;

    /* ---- assemble ordered sections (only those with content) ---- */
    const S = [];
    if (d.overview && d.overview.length)      S.push(['overview',     'Overview',     paras(d.overview)]);
    if (d.problem)                            S.push(['problem',      'Problem',      lead(d.problem)]);
    if (d.constraints && d.constraints.length)S.push(['constraints',  'Constraints',  bullets(d.constraints)]);
    if (d.arch && d.arch.tiers && d.arch.tiers.length) S.push(['architecture', 'Architecture', renderArch(d.arch)]);
    if (d.challenges && d.challenges.length)  S.push(['challenges',   'Engineering challenges', challengesInner(d.challenges)]);
    if (d.tradeoffs && d.tradeoffs.length)    S.push(['tradeoffs',    'Tradeoffs',    tradeoffsInner(d.tradeoffs)]);
    if (d.outcome && d.outcome.length)        S.push(['outcome',      'Outcome',      bullets(d.outcome)]);
    if (d.proves && d.proves.length)          S.push(['proves',       'What it proves', bullets(d.proves)]);
    if (d.performance && d.performance.length)S.push(['performance',  'Performance',  bullets(d.performance)]);
    if (d.deployment && d.deployment.length)  S.push(['deployment',   'Deployment',   bullets(d.deployment)]);
    if (d.stack && Object.keys(d.stack).length) S.push(['stack',      'Stack',        stackInner(d.stack)]);

    const nav = `
      <nav class="case-nav" aria-label="Case study sections">
        ${S.map((s, i) => `<button type="button" class="case-nav-link${i === 0 ? ' is-active' : ''}" data-target="cs-${s[0]}">${esc(s[1])}</button>`).join('')}
      </nav>`;

    const body = S.map(s => `
      <section id="cs-${s[0]}" class="case-section" tabindex="-1">
        <h3 class="case-h">${esc(s[1])}</h3>
        ${s[2]}
      </section>`).join('');

    const facts = [
      ['Role', d.role],
      ['Timeline', d.timeline],
      ['Status', d.status],
    ].filter(([, v]) => v);
    const factRow = `
      <div class="case-facts">
        ${facts.map(([k, v]) => `<div class="case-fact"><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </div>`;

    // Compact tech summary line in the hero (flattened, de-duped, capped)
    const techSummary = (() => {
      if (!d.stack) return '';
      const all = [];
      Object.values(d.stack).forEach(arr => arr.forEach(t => { if (!all.includes(t)) all.push(t); }));
      const shown = all.slice(0, 6);
      return `<p class="case-tech mono dim">${shown.map(esc).join('  ·  ')}</p>`;
    })();

    const links = (d.links && d.links.length) ? `
      <div class="case-links">
        ${d.links.map(l => `<a class="btn${l.primary ? ' primary' : ''}" href="${esc(l.url)}"${l.url.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>
          <span>${esc(l.label)}</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>`).join('')}
      </div>` : '';

    return `
      <header class="case-hero">
        <span class="eyebrow mono">${esc(d.tag || 'Case study')} · ${esc(d.timeline || '')}</span>
        <h2 id="caseTitle" class="case-title">${esc(d.title)}</h2>
        <p class="case-subtitle">${esc(d.subtitle)}</p>
        <p class="case-summary">${esc(d.summary)}</p>
        ${factRow}
        ${techSummary}
      </header>
      <div class="case-main">
        ${nav}
        <div class="case-body">
          ${body}
          ${links}
        </div>
      </div>`;
  }

  function initCases() {
    const overlay = $('#case');
    if (!overlay) return null;
    const scroll = $('#caseScroll', overlay);
    const closes = $$('[data-close="true"]', overlay);
    const focusables = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    let prevFocus = null;
    let caseObs = null;

    /* ---- mini-nav: scoped scroll + active highlighting ---- */
    const setActiveNav = (id) => {
      $$('.case-nav-link', scroll).forEach(b =>
        b.classList.toggle('is-active', b.getAttribute('data-target') === id));
    };
    const navScrollTo = (id) => {
      const el = scroll.querySelector('#' + id);
      if (!el) return;
      const top = el.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 10;
      scroll.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? 'auto' : 'smooth' });
    };
    const setupNavObserver = () => {
      if (caseObs) { caseObs.disconnect(); caseObs = null; }
      const sections = $$('.case-section', scroll);
      if (!sections.length || typeof IntersectionObserver === 'undefined') return;
      // The observer only triggers recomputation; selection is geometry-based so a
      // section pinned to the top wins (avoids the "topmost intersecting" off-by-one).
      const recompute = () => {
        const cTop = scroll.getBoundingClientRect().top;
        let activeId = sections[0].id;
        for (const s of sections) {
          if (s.getBoundingClientRect().top - cTop <= 120) activeId = s.id; else break;
        }
        setActiveNav(activeId);
      };
      caseObs = new IntersectionObserver(recompute, {
        root: scroll, threshold: [0, 0.25, 0.5, 0.75, 1],
      });
      sections.forEach(s => caseObs.observe(s));
    };

    const setOpen = (open, id) => {
      if (open) {
        const data = CASES[id];
        if (!data || !scroll) return;
        prevFocus = document.activeElement;
        scroll.innerHTML = renderCase(data);
        scroll.scrollTop = 0;
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        ScrollLock.lock('case');
        // Force a reflow so the opacity/transform transition reliably plays
        // (more robust than rAF, which can be throttled when no frame paints).
        void overlay.offsetWidth;
        overlay.classList.add('on');
        setupNavObserver();
        safeFocus($('.case-panel', overlay));
      } else {
        overlay.classList.remove('on');
        overlay.setAttribute('aria-hidden', 'true');
        if (caseObs) { caseObs.disconnect(); caseObs = null; }
        const finish = () => {
          overlay.hidden = true;
          if (scroll) scroll.innerHTML = '';
          ScrollLock.unlock('case');
          safeFocus(prevFocus);
        };
        if (reduceMotion()) finish();
        else setTimeout(finish, 240);
      }
    };

    // Mini-nav clicks (delegated; scoped to the overlay's scroll area)
    scroll.addEventListener('click', e => {
      const link = e.target instanceof Element ? e.target.closest('.case-nav-link') : null;
      if (!link) return;
      const id = link.getAttribute('data-target');
      setActiveNav(id);
      navScrollTo(id);
    });

    document.addEventListener('click', e => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      // Explicit "Case study" buttons (in cards and feature blocks)
      const btn = t.closest('.open-case');
      if (btn) {
        e.preventDefault();
        setOpen(true, btn.getAttribute('data-case'));
        return;
      }
      // Whole project / impact card is clickable — but let real links/buttons do their thing
      const card = t.closest('.project[data-case], .impact-card[data-case]');
      if (card && !t.closest('a, button')) {
        setOpen(true, card.getAttribute('data-case'));
      }
    });

    // Keyboard: Enter/Space on a role="button" impact card opens its case
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      const card = t.closest('.impact-card[data-case][role="button"]');
      if (card && t === card) {
        e.preventDefault();
        setOpen(true, card.getAttribute('data-case'));
      }
    });

    closes.forEach(c => c.addEventListener('click', () => setOpen(false)));

    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const list = $$(focusables, overlay).filter(el => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); safeFocus(last); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); safeFocus(first); }
    });

    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;

    return { open: (id) => setOpen(true, id), close: () => setOpen(false) };
  }

  /* -------- toast -------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 1700);
  }

  /* -------- copy helper -------- */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      return ok;
    }
  }

  /* -------- command palette -------- */
  function initPalette(projects) {
    const palette = $('#palette');
    const input = $('#paletteInput');
    const list = $('#paletteList');
    const btn = $('#cmdkBtn');
    if (!palette || !input || !list) return;

    const items = [
      { id: 'shell',    label: 'Open shell (terminal)',hint: '`',  kind: 'nav', action: () => { goSection('shell'); setTimeout(() => document.getElementById('termInput')?.focus(), 250); } },
      { id: 'work',     label: 'Go to Selected work',  hint: 'W',  kind: 'nav', action: () => goSection('work') },
      { id: 'projects', label: 'Go to Projects',       hint: 'P',  kind: 'nav', action: () => goSection('projects') },
      { id: 'principles',label:'Go to Principles',     hint: 'N',  kind: 'nav', action: () => goSection('principles') },
      { id: 'about',    label: 'Go to About',          hint: 'A',  kind: 'nav', action: () => goSection('about') },
      { id: 'stack',    label: 'Go to Stack',          hint: 'S',  kind: 'nav', action: () => goSection('stack') },
      { id: 'contact',  label: 'Go to Contact',        hint: 'C',  kind: 'nav', action: () => goSection('contact') },
      { id: 'top',      label: 'Scroll to top',        hint: 'T',  kind: 'nav', action: () => window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }) },
      { id: 'tour',     label: 'Run guided tour',      hint: '◐',  kind: 'do',  action: () => { goSection('shell'); setTimeout(() => document.getElementById('termInput')?.focus(), 250); setTimeout(() => { const i = document.getElementById('termInput'); if (i) { i.value = 'tour'; i.form?.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})); } }, 600); } },
      { id: 'neofetch', label: 'Run neofetch in shell',hint: '◯',  kind: 'do',  action: () => { goSection('shell'); setTimeout(() => { const i = document.getElementById('termInput'); if (i) { i.value = 'neofetch'; i.form?.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})); } }, 400); } },
      { id: 'email',    label: 'Copy email address',   hint: '@',  kind: 'do',  action: async () => {
        const ok = await copyToClipboard('nicholaslasagna@gmail.com');
        toast(ok ? 'Email copied' : 'Copy failed');
      }},
      { id: 'mail',     label: 'Open email client',           hint: '✉', kind: 'do', action: () => { window.location.href = 'mailto:nicholaslasagna@gmail.com'; } },
      { id: 'resume',   label: 'Download resume (PDF)',       hint: '↓', kind: 'do', action: () => { window.open('Resume.pdf', '_blank'); } },
      { id: 'github',   label: 'Open GitHub · nicholaslasagna', hint: '↗', kind: 'do', action: () => { window.open('https://github.com/nicholaslasagna', '_blank'); } },
      { id: 'linkedin', label: 'Open LinkedIn',               hint: '↗', kind: 'do', action: () => { window.open('https://www.linkedin.com/in/nicholas-lasagna-798118277', '_blank'); } },
      { id: 'realfic',  label: 'Open realfiction.live',       hint: '↗', kind: 'do', action: () => { window.open('https://realfiction.live', '_blank'); } },
      { id: 'theme',    label: 'Toggle theme',                hint: '◐', kind: 'do', action: () => $('#themeBtn')?.click() },
      { id: 'f-all',    label: 'Filter projects: All',        hint: '▢', kind: 'filter', action: () => { goSection('projects'); projects?.setFilter('all'); } },
      { id: 'f-systems',label: 'Filter projects: Systems',    hint: '▢', kind: 'filter', action: () => { goSection('projects'); projects?.setFilter('systems'); } },
      { id: 'f-games',  label: 'Filter projects: Games',      hint: '▢', kind: 'filter', action: () => { goSection('projects'); projects?.setFilter('games'); } },
      { id: 'f-infra',  label: 'Filter projects: Infra',      hint: '▢', kind: 'filter', action: () => { goSection('projects'); projects?.setFilter('infra'); } },
      { id: 'f-tools',  label: 'Filter projects: Tools',      hint: '▢', kind: 'filter', action: () => { goSection('projects'); projects?.setFilter('tools'); } },
    ];

    let filtered = items.slice();
    let selected = 0;

    const goSection = id => {
      const target = document.getElementById(id);
      if (!target) return;
      window.__scrollToId?.(id);
    };

    const iconFor = kind => {
      switch (kind) {
        case 'nav':    return '→';
        case 'filter': return '▢';
        case 'do':     return '·';
        default:       return '·';
      }
    };

    const render = () => {
      list.innerHTML = '';
      if (!filtered.length) {
        const e = document.createElement('div');
        e.className = 'palette-empty';
        e.textContent = 'No matches.';
        list.appendChild(e);
        return;
      }
      filtered.forEach((it, i) => {
        const row = document.createElement('div');
        row.className = 'palette-item';
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', i === selected ? 'true' : 'false');
        row.innerHTML = `
          <span class="palette-icon mono">${iconFor(it.kind)}</span>
          <span class="palette-label">${it.label}</span>
          <span class="palette-hint">${it.hint}</span>
        `;
        row.addEventListener('click', () => { runItem(it); });
        row.addEventListener('mouseenter', () => {
          selected = i;
          updateSelected();
        });
        list.appendChild(row);
      });
    };

    const updateSelected = () => {
      $$('.palette-item', list).forEach((row, i) => {
        row.setAttribute('aria-selected', i === selected ? 'true' : 'false');
      });
      const cur = $$('.palette-item', list)[selected];
      cur?.scrollIntoView({ block: 'nearest' });
    };

    const runItem = it => {
      setOpen(false);
      // Defer so the close animation happens cleanly
      setTimeout(() => it.action?.(), 60);
    };

    const setOpen = open => {
      if (open) {
        palette.hidden = false;
        palette.setAttribute('aria-hidden', 'false');
        ScrollLock.lock('palette');
        input.value = '';
        filtered = items.slice();
        selected = 0;
        render();
        setTimeout(() => safeFocus(input), 30);
      } else {
        palette.setAttribute('aria-hidden', 'true');
        palette.hidden = true;
        ScrollLock.unlock('palette');
      }
    };

    input.addEventListener('input', () => {
      const q = norm(input.value);
      filtered = !q
        ? items.slice()
        : items.filter(it => norm(it.label).includes(q) || norm(it.hint).includes(q) || norm(it.id).includes(q));
      selected = 0;
      render();
    });

    palette.addEventListener('click', e => {
      const t = e.target;
      if (t instanceof Element && t.matches('[data-close="true"]')) setOpen(false);
    });

    document.addEventListener('keydown', e => {
      const inField = e.target instanceof Element && (e.target.matches('input, textarea') || e.target.isContentEditable);
      const k = e.key;

      // Open palette
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) {
        e.preventDefault();
        setOpen(palette.hidden);
        return;
      }

      if (palette.hidden) {
        // global "/" focuses search if not in field
        if (k === '/' && !inField) {
          const search = $('#projectSearch');
          if (search) {
            e.preventDefault();
            window.__scrollToId?.('projects');
            setTimeout(() => safeFocus(search), 200);
          }
        }
        return;
      }

      if (k === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (k === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % filtered.length; updateSelected(); return; }
      if (k === 'ArrowUp')   { e.preventDefault(); selected = (selected - 1 + filtered.length) % filtered.length; updateSelected(); return; }
      if (k === 'Enter')     { e.preventDefault(); const it = filtered[selected]; if (it) runItem(it); return; }
    });

    btn?.addEventListener('click', () => setOpen(palette.hidden));

    // Adapt the visible label for non-Mac
    if (!isMac()) {
      const t = $('.kbd-keys', btn);
      if (t) t.innerHTML = '<span>Ctrl</span><span>K</span>';
    }
  }

  /* -------- copy on contact-row click -------- */
  function initContactCopy() {
    $$('.contact-row').forEach(row => {
      row.addEventListener('click', async e => {
        // Allow normal navigation; offer secondary "copy" via shift-click
        if (!e.shiftKey) return;
        e.preventDefault();
        const txt = $('.contact-val', row)?.textContent?.trim();
        if (!txt) return;
        const ok = await copyToClipboard(txt);
        toast(ok ? 'Copied' : 'Copy failed');
      });
    });

    // Click on the big email CTA: copy + open mail
    const cta = $('.contact-cta');
    cta?.addEventListener('click', async e => {
      // If user shift-clicks, copy instead of mailto
      if (!e.shiftKey) return;
      e.preventDefault();
      const ok = await copyToClipboard('nicholaslasagna@gmail.com');
      toast(ok ? 'Email copied' : 'Copy failed');
    });
  }

  /* -------- scroll to top -------- */
  function initFootTop() {
    const btn = $('#footTop');
    btn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  }

  /* -------- reveal animations -------- */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion()) {
      items.forEach(el => el.classList.add('show'));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          // small stagger by index in batch
          const delay = Math.min(i * 60, 240);
          setTimeout(() => e.target.classList.add('show'), delay);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => obs.observe(el));
  }

  /* -------- keyboard shortcuts (single-letter nav like vim) -------- */
  function initKeyboardNav(palette) {
    const map = {
      w: 'work', i: 'impact', p: 'projects', n: 'principles', a: 'about', s: 'stack', c: 'contact', t: 'top',
    };
    document.addEventListener('keydown', e => {
      const inField = e.target instanceof Element && (e.target.matches('input, textarea') || e.target.isContentEditable);
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 't') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
        return;
      }
      const id = map[k];
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      window.__scrollToId?.(id);
    });
  }

  /* -------- konami code easter egg (CRT mode) -------- */
  function initKonami() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let i = 0;
    document.addEventListener('keydown', e => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[i]) {
        i++;
        if (i === seq.length) {
          i = 0;
          document.body.classList.toggle('crt');
          toast(document.body.classList.contains('crt') ? 'CRT mode: on' : 'CRT mode: off');
        }
      } else {
        i = (k === seq[0]) ? 1 : 0;
      }
    });
  }

  /* -------- console signature -------- */
  function consoleSignature() {
    const name = '%cNicholas Lasagna';
    const tag  = '%c — Software Engineer · Texas Tech \'27';
    const body = '%c\n\n  /usr/local/bin/portfolio\n  → looking for systems eyes? mail nicholaslasagna@gmail.com\n  → ⌘K opens the palette · ` opens the shell · / focuses search\n  → letters jump: w work · p projects · n principles · a about · s stack · c contact · t top\n  → konami code does something\n';
    try {
      console.log(name + tag + body,
        'font: 600 14px ui-monospace, JetBrains Mono, monospace; color: #ec4d6e;',
        'font: 13px ui-monospace; color: #8d8a82;',
        'font: 12px ui-monospace; color: #c8c4ba;'
      );
    } catch {}
  }

  /* ==========================================================================
     TERMINAL — virtual shell with a real REPL
     ========================================================================== */

  const FS = (() => {
    const f = (content) => ({ type: 'file', content });
    const d = (children) => ({ type: 'dir', children });

    const README = `welcome to nicholaslasagna.com.

this is an actual REPL — not a video, not a screenshot.
type 'help' to see commands, or 'tour' for a guided walk.

start somewhere:
  cat about.md
  cat projects/realfiction.md
  cat projects/hearthaven.md
  cat projects/reallang.md
  cat projects/unitedexams.md
  cat principles.md
  ls projects/
  neofetch
`;

    const ABOUT = `nicholas lasagna — software engineering intern candidate.

cs at texas tech university — accelerated b.s./m.s. program.
b.s. expected may 2027, math minor, gpa 3.56 / 4.00.
currently in berkeley, california / bay area.

co-founded imagicast studios in 2021 and lead end-to-end development of
"abandoned horror," an asymmetrical multiplayer horror game (6v1v1).
three years of engine-level work in unreal engine 4/5, mostly in c++
and c#.

from there i moved deeper into systems, infrastructure, and backend /
platform work — distributed game servers on oracle cloud, real-time
multiplayer platforms, rust runtime tooling, and a from-scratch
compiler (reallang). my energy goes into the layer of the stack where
the abstraction breaks: servers, runtimes, compilers, and distributed
systems.

looking for: summer 2026 swe internship.
strongest fits: systems, backend / platform, distributed services,
cloud infrastructure, runtime / compilers, performance.
`;

    const PRINCIPLES = `engineering principles — six opinions, earned the hard way.

01. tail latency, not mean.
    "average response time looks fine" is the most expensive sentence in
    production. the user feels p99, not p50.

02. rust over c++ when getting it wrong panics someone else's machine.
    memory safety isn't a "feature" once code runs unsupervised on
    thousands of consumer hosts.

03. region-safe, not threadsafe-by-luck.
    "it's been fine for six months" is a coin landing heads. write code
    that's correct because the model says so.

04. read the source before guessing the bug.
    five extra minutes in grep beats two days arguing with intuition.

05. ship behind a known-good baseline.
    every change should be reversible. production is sacred.

06. tooling is product.
    the cli you build for yourself sets the velocity for everything else.
`;

    const STACK = `languages
  python         ── automation, ocr
  java           ── backends, jvm tuning
  rust           ── runtime, tooling
  c++ / c        ── ue5, low-level
  c#             ── ue / unity
  x64 assembly   ── architecture coursework
  javascript/ts  ── next.js, web
  sql            ── schema, rls
  html / css     ── structure, layout

infrastructure & cloud
  linux (ubuntu)      ── daily driver, prod
  oracle cloud (oci)  ── realfiction host
  docker              ── isolation, deploy
  git                 ── distributed workflow
  rest apis · ci/cd   ── design, pipelines

systems & backend & compilers
  distributed systems ── multi-node, real-time
  runtime debugging   ── jvm tuning, monitoring
  postgresql          ── schema, queries
  supabase            ── auth, realtime, rls
  compiler design     ── reallang · parsing · codegen
  memory safety       ── rust runtime tooling

frameworks & engines
  next.js             ── hearthaven, unitedexams
  phaser              ── browser game runtime
  unreal engine 4/5   ── imagicast titles
  unity               ── prototype work
  clickteam fusion 2.5 ── rapid 2d prototypes
  blender             ── asset pipeline
`;

    const CONTACT = `contact

  email     nicholaslasagna@gmail.com
  github    github.com/nicholaslasagna
  linkedin  linkedin.com/in/nicholas-lasagna-798118277
  resume    /Resume.pdf
  website   https://www.nicholaslasagna.com

shortcut: 'email' opens your mail client, 'resume' downloads the pdf.
`;

    const EDU = `texas tech university   — b.s. computer science (math minor)
  program     accelerated bs/ms — grad-level coursework during undergrad
  enrolled    fall 2023
  graduate    b.s. may 2027
  gpa         3.56 / 4.00

  coursework  computer architecture, theory of automata,
              software engineering, data structures & algorithms,
              analysis of algorithms, systems & assembly,
              engineering statistics, differential equations
`;

    const REALFIC = `realfiction — distributed multiplayer server infrastructure [ 2023 → live ]

stack: java · distributed systems · oracle cloud (oci) · ubuntu · jvm tuning · live ops

architected and operated a distributed multiplayer server infrastructure
hosted on oracle cloud infrastructure (oci) using ubuntu linux. managed
live production backend systems supporting concurrent real-time
multiplayer workloads — high availability, low latency.

highlights:
  → multi-server architecture integrating custom backend services,
    persistent player data systems, and live production debugging.
  → configured advanced networking, permissions, deployment pipelines,
    process monitoring, jvm tuning, and runtime optimization.
  → tail latency over mean as the actual player-experience kpi.
  → every change shipped behind a known-good baseline.

links:
  https://realfiction.live
  https://github.com/nicholaslasagna
`;

    const RUSTRUNTIME = `rust runtime tooling — memory-safe systems for a live community [ 2024 → active ]

stack: rust · memory safety · concurrency · low-level systems

engineered performance-sensitive runtime tooling in rust for a large-scale
game modification project with active community usage. debugged complex
runtime behavior involving concurrent execution and systems-level
resource management.

why rust over c++:
  the type system pays for itself in tooling that runs close to a host
  process. memory safety isn't a feature here — it's a precondition.

highlights:
  → strict focus on memory safety, runtime correctness, and low-level
    systems interaction to ensure stability under load.
  → debugged complex concurrency behavior and explicit failure handling
    across many user environments.
  → loud-in-dev, graceful-in-prod for community-facing tooling.

links:
  https://github.com/nicholaslasagna
`;

    const IMAGICAST = `imagicast studios — engine & systems                  [ 2021 → present ]

stack: unreal engine 4/5 · c++ · c# · multiplayer · gameplay systems

co-founded a game studio; lead engine-level systems across two titles:
  • abandoned horror  — asymmetrical 6v1v1 multiplayer horror
  • heroic submission — second original ip, in development

owned core systems architecture from initial design through production
deployment.

highlights:
  → engine-level gameplay systems, state management, input handling,
    and runtime multiplayer logic in unreal engine 4/5.
  → designed and implemented distinctive roles within the 6v1v1 loop.
  → git-based distributed workflows — correctness, maintainability,
    and feature delivery in balance.

links:
  https://github.com/nicholaslasagna
`;

    const HEARTHAVEN = `hearthaven — real-time multiplayer web platform       [ 2025 → in dev ]

stack: next.js · typescript · phaser · supabase · postgresql · rls · realtime

a multiplayer application platform — not a website. players share a
living space: a companion system, room decorating, gardening, and
social interaction, rendered with phaser and synchronized live.

architecture:
  next.js + phaser (client) → supabase realtime (presence/broadcast)
  → supabase auth + postgres (authoritative state, row-level security)

highlights:
  → optimistic local updates reconciled against an authoritative
    postgres; realtime presence + broadcast keep a room in sync.
  → typed state bridge between phaser's render loop and react/next —
    one direction of truth, no tearing.
  → row-level security enforces per-user access at the database; a
    forged request can't read or write another player's data.

links:
  https://github.com/nicholaslasagna
`;

    const REALLANG = `reallang — an ai-native programming language          [ 2025 → r&d ]

stack: rust · c backend · compiler design · parsing · llm reliability

a language designed to be generated and repaired reliably by models.
three ideas drive it:
  • deterministic syntax   — one canonical way to express a construct
  • repairable diagnostics — errors carry machine-applicable fixes
  • c-backed execution     — lower to c for predictable native speed

pipeline:
  source → lexer → parser (recursive descent) → ast
         → repairable diagnostics → codegen (c) → native binary

highlights:
  → deterministic syntax + canonical formatter shrink the decision
    space a model has to navigate; generation becomes repeatable.
  → diagnostics emitted as structured records (location, cause, fix)
    so tooling or an llm can apply repairs programmatically.
  → recursive-descent front end with explicit error recovery; lowers
    to c so programs run as predictable native binaries.

links:
  https://github.com/nicholaslasagna
`;

    const UNITED = `unitedexams — full-stack educational platform         [ 2025 ]

stack: next.js · typescript · supabase · postgresql · rls

a practice-and-progress platform: organized courses, adaptive practice,
accounts, and progress tracking on a secure, row-level-secured backend.

highlights:
  → adaptive selection models per-topic mastery and picks the next
    item from weak areas instead of a fixed sequence.
  → supabase auth + protected routes; rls enforces per-user ownership
    at the database, not just the client.
  → schema, policies, and migrations versioned together.

links:
  https://github.com/nicholaslasagna
`;

    const REALCHAT = `realchat — high-performance python automation system  [ 2023 ]

stack: python · event-driven systems · automation · ocr · tesseract · macos

high-performance python desktop automation system integrating ocr
pipelines and ai-assisted workflows. event-driven, low-latency, and
safe by construction.

highlights:
  → complex screen capture, text parsing, decision matrices, and
    system-level automation with runtime safety.
  → encrypted licensing and authentication: secure environment
    variables, runtime validation.
  → optimized low-latency execution and robust error handling for
    safe operating system interaction.

links:
  https://github.com/nicholaslasagna
`;

    const LOWLEVEL = `low-level cs & systems                                [ ongoing ]

stack: c · x64 assembly · architecture · automata · algorithms

texas tech coursework + self-study via the accelerated bs/ms program.
the kind of work that makes rust's borrow checker feel like a friend.

  → computer architecture and x64 assembly: registers, memory layout,
    calling conventions, instruction-level behavior.
  → c / c++ systems study: pointers, compilation, os fundamentals.
  → theory: grammars, automata, recursive descent, shift-reduce,
    analysis of algorithms, engineering statistics.
`;

    const PORTSHELL = `interactive portfolio shell                           [ 2026 ]

stack: html · css · javascript · github pages · cloudflare

this site. hand-written html / css / js with an interactive
terminal-style repl, command history, project search, view transitions,
and accessible mobile nav — no frameworks.

highlights:
  → real repl with virtual filesystem (you're using it).
  → command palette (⌘k), keyboard shortcuts, theme toggle, live local
    time pinned to berkeley, live web vitals readout.
  → live realfiction status ping in the hero.
  → deployed via github pages with a cloudflare-managed custom domain.
`;

    return {
      '/': d({
        'README.md':       f(README),
        'about.md':        f(ABOUT),
        'principles.md':   f(PRINCIPLES),
        'stack.txt':       f(STACK),
        'contact.txt':     f(CONTACT),
        'education.txt':   f(EDU),
        'projects':        d({
          'realfiction.md':       f(REALFIC),
          'hearthaven.md':        f(HEARTHAVEN),
          'reallang.md':          f(REALLANG),
          'unitedexams.md':       f(UNITED),
          'rust-runtime.md':      f(RUSTRUNTIME),
          'imagicast.md':         f(IMAGICAST),
          'realchat.md':          f(REALCHAT),
          'portfolio-shell.md':   f(PORTSHELL),
          'lowlevel.md':          f(LOWLEVEL),
        }),
        '.secrets':        d({
          'easter.md': f("you found it.\n\ntry the konami code: ↑↑↓↓←→←→ b a\nor type 'fortune' for a quote.\n\np.s. real recruiters get an actual cover letter.\n"),
        }),
      }),
    };
  })();

  function initTerminal() {
    const term = document.getElementById('term');
    if (!term) return null;
    const out = document.getElementById('termOutput');
    const form = document.getElementById('termForm');
    const input = document.getElementById('termInput');
    const expandBtn = document.getElementById('termExpand');
    const clearBtn = document.getElementById('termClear');
    const cwdEls = $$('[data-cwd]', term);
    if (!out || !form || !input) return null;

    let cwd = '/';
    const history = [];
    let historyIdx = -1;

    /* ---- output helpers ---- */
    const escape = s => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const linkify = s => {
      // Turn URLs into anchor tags after escaping
      return s.replace(/https?:\/\/[^\s<>"]+/g, m => `<a href="${m}" target="_blank" rel="noreferrer">${m}</a>`);
    };

    const print = (html, kind = '') => {
      const div = document.createElement('div');
      div.className = 'term-line ' + kind;
      div.innerHTML = html;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    };
    const printText = (text, kind = '') => print(linkify(escape(text)), kind);
    const printErr = text => print(`<span class="err">${escape(text)}</span>`);
    const printInfo = text => print(`<span class="info">${escape(text)}</span>`);
    const printOk = text => print(`<span class="ok">${escape(text)}</span>`);
    const newline = () => print('&nbsp;');

    const echoCommand = raw => {
      const safe = escape(raw);
      const promptHTML = `<span class="cmd"><span class="term-user">nicholas</span><span class="term-at">@</span><span class="term-host">portfolio</span><span class="term-colon">:</span><span class="term-path">${escape(displayCwd())}</span><span class="term-sigil"> $</span> <span class="cmd-name">${safe}</span></span>`;
      print(promptHTML);
    };

    /* ---- path helpers ---- */
    const displayCwd = () => cwd === '/' ? '~' : '~' + cwd;
    const updateCwdEls = () => cwdEls.forEach(el => { el.textContent = displayCwd(); });

    const resolvePath = (p) => {
      if (!p) return cwd;
      let path = p;
      if (path === '~') path = '/';
      else if (path.startsWith('~/')) path = path.slice(1);
      else if (!path.startsWith('/')) path = (cwd === '/' ? '/' : cwd + '/') + path;
      // Normalize ./ and ../
      const parts = path.split('/').filter(Boolean);
      const out = [];
      for (const seg of parts) {
        if (seg === '.') continue;
        if (seg === '..') out.pop();
        else out.push(seg);
      }
      return '/' + out.join('/');
    };

    const lookup = (path) => {
      const p = resolvePath(path);
      if (p === '/') return FS['/'];
      const segs = p.split('/').filter(Boolean);
      let node = FS['/'];
      for (const s of segs) {
        if (!node || node.type !== 'dir') return null;
        node = node.children[s];
        if (!node) return null;
      }
      return node;
    };

    /* ---- commands ---- */
    const COMMANDS = {
      help: {
        desc: 'list commands',
        run: () => {
          const rows = [
            ['help',                'list commands'],
            ['ls [path]',           'list files in current or given dir'],
            ['cd <path>',           'change directory (~, .., projects, /)'],
            ['cat <file>',          'print a file'],
            ['pwd',                 'print working directory'],
            ['tree',                'print full filesystem tree'],
            ['echo <text>',         'echo back text'],
            ['clear',               'clear the screen'],
            ['history',             'show command history'],
            ['date',                'current date and time'],
            ['uptime',              'shipping uptime since 2021'],
            ['neofetch',            'system info card'],
            ['whoami',              'short bio'],
            ['fortune',             'a quote, from someone'],
            ['theme [light|dark]',  'toggle or set theme'],
            ['goto <id>',           'scroll the page to a section'],
            ['email',               'open mail client to nicholaslasagna@gmail.com'],
            ['resume',              'open the resume pdf'],
            ['github [alt]',        'open the primary or alt github profile'],
            ['linkedin',            'open linkedin'],
            ['exit',                'collapse the terminal'],
            ['tour',                'guided walkthrough of this site'],
          ];
          const w = Math.max(...rows.map(r => r[0].length));
          const lines = rows.map(([k, v]) => `  ${k.padEnd(w + 2)}${v}`).join('\n');
          printText(lines);
        }
      },

      ls: {
        desc: 'list files',
        run: (args) => {
          const target = args[0] || cwd;
          const node = lookup(target);
          if (!node) return printErr(`ls: cannot access '${target}': no such file or directory`);
          if (node.type === 'file') return printText(target);
          const entries = Object.entries(node.children).sort((a, b) => {
            // dirs first, then files
            if (a[1].type !== b[1].type) return a[1].type === 'dir' ? -1 : 1;
            return a[0].localeCompare(b[0]);
          });
          const cols = entries.map(([name, n]) => {
            const display = n.type === 'dir' ? `<span class="info">${escape(name)}/</span>` : escape(name);
            return display;
          });
          // Render as wrapping grid (mono spacing)
          print(cols.join('   '));
        }
      },

      cd: {
        desc: 'change directory',
        run: (args) => {
          const target = args[0] || '/';
          if (target === '-') { cwd = '/'; updateCwdEls(); return; }
          const path = resolvePath(target);
          const node = lookup(path);
          if (!node) return printErr(`cd: ${target}: no such file or directory`);
          if (node.type !== 'dir') return printErr(`cd: ${target}: not a directory`);
          cwd = path;
          updateCwdEls();
        }
      },

      cat: {
        desc: 'print file',
        run: (args) => {
          if (!args.length) return printErr('cat: missing operand. try: cat about.md');
          for (const a of args) {
            const node = lookup(a);
            if (!node) { printErr(`cat: ${a}: no such file or directory`); continue; }
            if (node.type === 'dir') { printErr(`cat: ${a}: is a directory`); continue; }
            printText(node.content.trimEnd());
          }
        }
      },

      pwd: { desc: 'print working dir', run: () => printText(displayCwd()) },

      tree: {
        desc: 'print full tree',
        run: () => {
          const lines = ['~/'];
          const walk = (node, prefix) => {
            const keys = Object.keys(node.children);
            keys.forEach((k, i) => {
              const last = i === keys.length - 1;
              const child = node.children[k];
              lines.push(prefix + (last ? '└── ' : '├── ') + (child.type === 'dir' ? k + '/' : k));
              if (child.type === 'dir') walk(child, prefix + (last ? '    ' : '│   '));
            });
          };
          walk(FS['/'], '');
          printText(lines.join('\n'));
        }
      },

      echo: { desc: 'echo', run: (args) => printText(args.join(' ')) },

      clear: { desc: 'clear', run: () => { out.innerHTML = ''; } },

      history: {
        desc: 'show history',
        run: () => {
          if (!history.length) return printText('  (no commands yet)');
          const lines = history.map((h, i) => `  ${(i + 1).toString().padStart(3)}  ${h}`).join('\n');
          printText(lines);
        }
      },

      date: {
        desc: 'date and time',
        run: () => printText(new Date().toString())
      },

      uptime: {
        desc: 'uptime',
        run: () => {
          const start = new Date('2021-06-01');
          const now = new Date();
          const yrs = ((now - start) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2);
          printText(`shipping uptime: ${yrs} years (since 2021).
no scheduled maintenance windows. occasional production fires.`);
        }
      },

      whoami: { desc: 'short bio', run: () => printText('nicholas lasagna — software engineer · texas tech \'27 · berkeley, ca.\nopen to summer 2026 swe internships.') },

      fortune: {
        desc: 'a quote',
        run: () => {
          const lines = [
            '"premature optimization is the root of all evil." — donald knuth',
            '"the cheapest, fastest, and most reliable components are those that aren\'t there." — gordon bell',
            '"there are 2 hard problems in computer science: cache invalidation, naming things, and off-by-one errors."',
            '"weeks of programming can save you hours of planning."',
            '"the best code is the code you didn\'t have to write."',
            '"if it doesn\'t panic in development, it will panic in production."',
            '"the type system is the test suite you wrote in advance." — me, probably',
          ];
          printText(lines[Math.floor(Math.random() * lines.length)]);
        }
      },

      neofetch: {
        desc: 'system info',
        run: () => {
          const ascii = `         .---.
       .'_:___\".
       |__ --==|
       [  ]  :[|
       |__| I=[|
       / / ____|
      |-/.____.'
     /___\\ /___\\`;

          const start = new Date('2021-06-01');
          const yrs = ((Date.now() - start) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

          const rows = [
            ['user',    'nicholas@portfolio'],
            ['os',      'nicholaslasagna.com (static, hand-written)'],
            ['kernel',  'inter / instrument-serif / jetbrains-mono'],
            ['shell',   'js (esm, no deps)'],
            ['uptime',  `${yrs} years (shipping since 2021)`],
            ['edu',     'texas tech — accel. bs/ms cs (\'27) · gpa 3.56'],
            ['stack',   'rust · java · typescript · python · c++ · x64 asm'],
            ['active',  'reallang · hearthaven · realfiction · rust runtime'],
            ['focus',   'systems · backend · infra · cloud · distributed · compilers'],
            ['status',  'open to summer 2026 swe internships'],
          ];

          const rowHtml = rows.map(([k, v]) => `<span class="k">${escape(k)}</span> <span class="v">${linkify(escape(v))}</span>`).join('\n');

          print(`<div class="ascii-block"><pre>${escape(ascii)}</pre><div class="info-rows">${rowHtml}</div></div>`);
        }
      },

      theme: {
        desc: 'toggle/set theme',
        run: (args) => {
          const html = document.documentElement;
          const cur = html.getAttribute('data-theme') || 'dark';
          let next;
          if (args[0] === 'light' || args[0] === 'dark') next = args[0];
          else next = cur === 'light' ? 'dark' : 'light';
          if (next === 'light') html.setAttribute('data-theme', 'light');
          else html.setAttribute('data-theme', 'dark');
          try { localStorage.setItem('theme', next); } catch {}
          $('#themeBtn')?.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
          printOk(`theme set to ${next}.`);
        }
      },

      goto: {
        desc: 'scroll to section',
        run: (args) => {
          if (!args[0]) return printErr('goto: missing section. try: goto projects');
          const id = args[0].replace(/^#/, '');
          if (!document.getElementById(id)) return printErr(`goto: section '${id}' not found.`);
          window.__scrollToId?.(id);
          printOk(`scrolled to #${id}.`);
        }
      },

      email: {
        desc: 'open mail',
        run: () => {
          window.location.href = 'mailto:nicholaslasagna@gmail.com';
          printOk('opening mail to nicholaslasagna@gmail.com');
        }
      },

      resume: {
        desc: 'open resume',
        run: () => { window.open('Resume.pdf', '_blank'); printOk('opening Resume.pdf'); }
      },

      github: {
        desc: 'open github',
        run: () => {
          const url = 'https://github.com/nicholaslasagna';
          window.open(url, '_blank'); printOk(`opening ${url}`);
        }
      },

      linkedin: {
        desc: 'open linkedin',
        run: () => { window.open('https://www.linkedin.com/in/nicholas-lasagna-798118277', '_blank'); printOk('opening linkedin'); }
      },

      exit: {
        desc: 'close terminal',
        run: () => {
          term._setFull?.(false);
          newline();
          printInfo('terminal collapsed. press ` to focus again.');
        }
      },

      tour: {
        desc: 'guided walkthrough',
        run: async () => {
          const stops = [
            { id: 'shell',     msg: 'you are here. an actual shell, in the page.' },
            { id: 'work',      msg: 'selected work — two live, public-facing systems.' },
            { id: 'projects',  msg: 'all projects, filterable. try the "rust" search.' },
            { id: 'principles',msg: 'six engineering opinions, earned the hard way.' },
            { id: 'about',     msg: 'short bio + texas tech timeline.' },
            { id: 'stack',     msg: 'honest stack — what i\'ve actually shipped with.' },
            { id: 'contact',   msg: 'fastest way to reach me.' },
          ];
          for (const s of stops) {
            window.__scrollToId?.(s.id);
            printInfo(`#${s.id}: ${s.msg}`);
            await new Promise(r => setTimeout(r, reduceMotion() ? 250 : 1100));
          }
          printOk('tour complete. \\;\\)');
          window.__scrollToId?.('shell');
        }
      },

      // Light easter eggs
      vim:    { desc: 'jk', run: () => printErr("you don't need vim here. try ':q' anyway. just kidding, you can't quit.") },
      nano:   { desc: 'jk', run: () => printErr('nano is not installed. (this is a portfolio.)') },
      emacs:  { desc: 'jk', run: () => printErr('emacs would be too much for a static site. try `vim`.') },
      ssh:    { desc: 'jk', run: () => printErr('ssh: connect to host portfolio port 22: connection refused.') },
      sudo:   { desc: 'jk', run: () => printErr('user is not in the sudoers file. this incident will not be reported.') },
      rm:     { desc: 'jk', run: (a) => printErr(a.includes('-rf') ? 'i admire your courage. permission denied.' : 'rm: try cat instead.') },
      'man':  { desc: 'show command help', run: (args) => {
        if (!args[0]) return printErr('what manual page do you want? try: man cat');
        const c = COMMANDS[args[0]];
        if (!c) return printErr(`no manual entry for ${args[0]}`);
        printText(`NAME\n  ${args[0]} — ${c.desc}\n\nSEE ALSO\n  help`);
      }},
    };

    // Aliases
    COMMANDS['?']  = COMMANDS.help;
    COMMANDS['h']  = COMMANDS.help;
    COMMANDS['ll'] = COMMANDS.ls;
    COMMANDS['dir']= COMMANDS.ls;

    /* ---- runner ---- */
    const tokenize = (line) => line.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];

    const run = async (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) { newline(); return; }
      history.push(trimmed);
      historyIdx = -1;
      echoCommand(trimmed);

      const parts = tokenize(trimmed);
      const name = parts.shift().toLowerCase();
      const args = parts.map(s => s.replace(/^"|"$/g, ''));
      const cmd = COMMANDS[name];
      if (!cmd) {
        printErr(`${name}: command not found. try 'help'.`);
        return;
      }
      try { await cmd.run(args); }
      catch (e) { printErr(`${name}: error: ${e.message || e}`); }
    };

    /* ---- autocomplete ---- */
    const complete = (line) => {
      const parts = line.split(/\s+/);
      if (parts.length === 1) {
        const matches = Object.keys(COMMANDS).filter(c => c.startsWith(parts[0]));
        return matches.length === 1 ? matches[0] + ' ' : null;
      }
      // Path completion for last token
      const last = parts[parts.length - 1] || '';
      let dirPath = cwd, prefix = last;
      const slash = last.lastIndexOf('/');
      if (slash >= 0) {
        dirPath = resolvePath(last.slice(0, slash) || '/');
        prefix = last.slice(slash + 1);
      } else if (last.startsWith('~')) {
        dirPath = '/'; prefix = last.slice(2);
      }
      const node = lookup(dirPath);
      if (!node || node.type !== 'dir') return null;
      const matches = Object.keys(node.children).filter(n => n.startsWith(prefix));
      if (matches.length !== 1) {
        if (matches.length > 1) {
          newline(); printText('  ' + matches.join('   '));
        }
        return null;
      }
      const match = matches[0];
      const head = parts.slice(0, -1).join(' ');
      const dir = (slash >= 0) ? last.slice(0, slash + 1) : '';
      const completed = (head ? head + ' ' : '') + dir + match + (node.children[match].type === 'dir' ? '/' : ' ');
      return completed;
    };

    /* ---- focus / events ---- */
    term.addEventListener('click', e => {
      // Don't steal focus from buttons/links
      if (e.target instanceof Element && e.target.closest('a, button, input')) return;
      input.focus();
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      await run(v);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length) return;
        if (historyIdx === -1) historyIdx = history.length - 1;
        else if (historyIdx > 0) historyIdx--;
        input.value = history[historyIdx] || '';
        // move cursor to end
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx === -1) return;
        if (historyIdx < history.length - 1) {
          historyIdx++;
          input.value = history[historyIdx];
        } else {
          historyIdx = -1;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const completed = complete(input.value);
        if (completed) input.value = completed;
      } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        out.innerHTML = '';
      } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        // visually echo the prompt and abort current input
        echoCommand(input.value + '^C');
        input.value = '';
      }
    });

    /* ---- fullscreen helper — single source of truth + scroll lock ---- */
    const setFull = (on) => {
      term.classList.toggle('is-full', on);
      if (on) ScrollLock.lock('term'); else ScrollLock.unlock('term');
    };

    /* ---- bar buttons ---- */
    expandBtn?.addEventListener('click', () => {
      setFull(!term.classList.contains('is-full'));
      input.focus();
    });
    clearBtn?.addEventListener('click', () => { out.innerHTML = ''; input.focus(); });
    $$('.t-dot', term).forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'exit') { setFull(false); }
        if (action === 'expand') { setFull(!term.classList.contains('is-full')); input.focus(); }
        if (action === 'minimize') { setFull(false); }
      });
    });

    /* expose for commands that collapse the terminal */
    term._setFull = setFull;

    /* ---- global focus shortcut: ` ---- */
    document.addEventListener('keydown', e => {
      const inField = e.target instanceof Element && (e.target.matches('input, textarea') || e.target.isContentEditable);
      if (inField) return;
      if (e.key === '`' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        window.__scrollToId?.('shell');
        setTimeout(() => input.focus(), 200);
      } else if (e.key === 'Escape' && term.classList.contains('is-full')) {
        setFull(false);
      }
    });

    /* ---- boot sequence (deferred + cinematic typing on viewport enter) ---- */
    updateCwdEls();
    const start = new Date('2021-06-01');
    const yrs = ((Date.now() - start) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

    const bootLines = [
      { text: `nicholas@portfolio v2.7.0 — uptime ${yrs}y`, kind: 'info' },
      { text: `type 'help' for commands. try 'cat about.md', 'tour', or 'neofetch'.`, kind: 'text' },
    ];

    const printPlain = () => {
      printInfo(bootLines[0].text);
      printText(bootLines[1].text);
      newline();
    };

    // Type a single line character-by-character with a blinking caret at the end.
    const typeLine = (line) => new Promise(resolve => {
      const div = document.createElement('div');
      div.className = 'term-line ' + (line.kind === 'info' ? '' : '');
      const textEl = document.createElement('span');
      if (line.kind === 'info') textEl.className = 'info';
      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      div.appendChild(textEl);
      div.appendChild(caret);
      out.appendChild(div);

      let i = 0;
      const tick = () => {
        if (i >= line.text.length) {
          caret.remove();
          out.scrollTop = out.scrollHeight;
          resolve();
          return;
        }
        textEl.textContent += line.text[i++];
        out.scrollTop = out.scrollHeight;
        setTimeout(tick, 8 + Math.random() * 14);
      };
      tick();
    });

    let booted = false;
    const startBoot = async () => {
      if (booted) return;
      booted = true;
      if (reduceMotion()) {
        printPlain();
        return;
      }
      // Small initial pause so the section settles into view before typing
      await new Promise(r => setTimeout(r, 220));
      for (const line of bootLines) {
        await typeLine(line);
        await new Promise(r => setTimeout(r, 80));
      }
      newline();
    };

    // Trigger boot when the terminal is intersecting the viewport
    if (typeof IntersectionObserver !== 'undefined') {
      const bootObs = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            bootObs.disconnect();
            startBoot();
            break;
          }
        }
      }, { threshold: 0.18 });
      bootObs.observe(term);
    } else {
      // No IO support — print immediately.
      printPlain();
    }

    return {
      run: (s) => run(s),
      focus: () => input.focus(),
      boot: startBoot,
    };
  }

  /* ==========================================================================
     LIVE GITHUB ACTIVITY — public events + heatmap
     ========================================================================== */

  const GITHUB_USER = 'nicholaslasagna';

  function relTime(date) {
    const d = (Date.now() - date.getTime()) / 1000;
    if (d < 60) return `${Math.floor(d)}s`;
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    if (d < 86400) return `${Math.floor(d / 3600)}h`;
    if (d < 86400 * 30) return `${Math.floor(d / 86400)}d`;
    if (d < 86400 * 365) return `${Math.floor(d / (86400 * 30))}mo`;
    return `${Math.floor(d / (86400 * 365))}y`;
  }

  // Robust push-count: GitHub may fill commits[] OR distinct_size OR size.
  // We pick the largest signal so a 0 never sneaks through.
  function pushCount(e) {
    if (!e || !e.payload) return 0;
    return Math.max(
      Array.isArray(e.payload.commits) ? e.payload.commits.length : 0,
      typeof e.payload.distinct_size === 'number' ? e.payload.distinct_size : 0,
      typeof e.payload.size === 'number' ? e.payload.size : 0
    );
  }

  function eventIcon(type) {
    switch (type) {
      case 'PushEvent':         return '↟';
      case 'CreateEvent':       return '+';
      case 'DeleteEvent':       return '−';
      case 'ForkEvent':         return '⑂';
      case 'IssuesEvent':       return '!';
      case 'PullRequestEvent':  return '◐';
      case 'WatchEvent':        return '★';
      case 'PublicEvent':       return '◯';
      case 'CommitCommentEvent':return '✎';
      default:                  return '·';
    }
  }

  function eventLabel(e) {
    switch (e.type) {
      case 'PushEvent': {
        const n = pushCount(e);
        return `pushed ${n} commit${n === 1 ? '' : 's'} to`;
      }
      case 'CreateEvent':       return `created ${e.payload?.ref_type || 'something'} on`;
      case 'DeleteEvent':       return `deleted ${e.payload?.ref_type || 'something'} on`;
      case 'ForkEvent':         return 'forked';
      case 'IssuesEvent':       return `${e.payload?.action || 'updated'} issue on`;
      case 'PullRequestEvent':  return `${e.payload?.action || 'updated'} pull request on`;
      case 'WatchEvent':        return 'starred';
      case 'PublicEvent':       return 'made public';
      default:                  return e.type.replace(/Event$/, '').toLowerCase() + ' on';
    }
  }

  async function initGithubActivity() {
    const root = document.getElementById('activity');
    if (!root) return;
    const heatmap = root.querySelector('#heatmap');
    const feed = root.querySelector('#feed');
    const status = root.querySelector('[data-feed-status]');
    if (!heatmap || !feed) return;

    /* ---- heatmap shell: 52 weeks × 7 days ---- */
    const WEEKS = 52;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - (WEEKS * 7 - 1));
    // Align startDay to Sunday so columns are clean weeks
    const dow = startDay.getDay(); // 0..6 (Sun..Sat)
    if (dow !== 0) startDay.setDate(startDay.getDate() - dow);

    const dayKey = (d) => d.toISOString().slice(0, 10);
    const cellByDay = new Map();
    heatmap.innerHTML = '';

    const totalDays = Math.ceil(((today - startDay) / 86400000)) + 1;
    const padded = Math.max(WEEKS * 7, totalDays);
    for (let i = 0; i < padded; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      if (d > today) break;
      const key = dayKey(d);
      const el = document.createElement('div');
      el.className = 'heatmap-cell';
      el.title = `${key}: 0 contributions`;
      el.dataset.date = key;
      heatmap.appendChild(el);
      cellByDay.set(key, el);
    }

    /* ---- 1. try real contribution graph (full year, includes private) ---- */
    let contribTotal = 0;
    let contribFromGraph = false;
    const LEVEL_MAP = {
      NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4
    };
    try {
      const r = await fetch(`https://github-contributions-api.deno.dev/${GITHUB_USER}.json?flat=true`, { mode: 'cors' });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data?.contributions)) {
          for (const day of data.contributions) {
            const el = cellByDay.get(day.date);
            // The API returns either a string enum (contributionLevel) or a number (level)
            let lvl = 0;
            if (typeof day.contributionLevel === 'string') {
              lvl = LEVEL_MAP[day.contributionLevel] ?? 0;
            } else if (typeof day.level === 'number') {
              lvl = Math.max(0, Math.min(4, day.level));
            }
            const cnt = +day.contributionCount || +day.count || 0;
            contribTotal += cnt;
            if (el && lvl > 0) {
              el.classList.add('l-' + lvl);
              el.title = `${day.date}: ${cnt} contribution${cnt === 1 ? '' : 's'}`;
            } else if (el && cnt > 0) {
              // Fallback: count present but no level — derive level from count
              const fallbackLvl = cnt >= 10 ? 4 : cnt >= 5 ? 3 : cnt >= 2 ? 2 : 1;
              el.classList.add('l-' + fallbackLvl);
              el.title = `${day.date}: ${cnt} contribution${cnt === 1 ? '' : 's'}`;
            } else if (el) {
              el.title = `${day.date}: 0 contributions`;
            }
          }
          contribFromGraph = true;
        }
      }
    } catch {}

    /* ---- 2. always also fetch recent events for the feed (and as heatmap fallback) ---- */
    let events = [];
    try {
      const r = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`, {
        headers: { 'Accept': 'application/vnd.github+json' }
      });
      if (r.ok) {
        let raw = await r.json();
        if (!Array.isArray(raw)) raw = [];
        events = raw.filter(e => {
          if (e.type === 'PushEvent') return pushCount(e) > 0;
          return ['CreateEvent','PullRequestEvent','IssuesEvent','ReleaseEvent','ForkEvent','PublicEvent','CommitCommentEvent'].includes(e.type);
        });
      }
    } catch {}

    /* ---- if the graph API failed, use events as a (sparse) fallback ---- */
    if (!contribFromGraph) {
      const counts = {};
      for (const e of events) {
        if (e.type === 'PushEvent') {
          const k = (e.created_at || '').slice(0, 10);
          if (k) counts[k] = (counts[k] || 0) + pushCount(e);
        } else {
          const k = (e.created_at || '').slice(0, 10);
          if (k) counts[k] = (counts[k] || 0) + 1;
        }
      }
      const maxCount = Math.max(1, ...Object.values(counts));
      for (const [k, n] of Object.entries(counts)) {
        const el = cellByDay.get(k);
        if (!el) continue;
        const ratio = n / maxCount;
        let level = 1;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        el.classList.add('l-' + level);
        el.title = `${k}: ${n}+ event${n === 1 ? '' : 's'}`;
        contribTotal += n;
      }
    }

    /* ---- status line — count animates up when section enters viewport ---- */
    if (status) {
      if (contribFromGraph) {
        status.innerHTML = `<span data-count>0</span> contributions in the last year · refreshed <span>just now</span>`;
        const counter = status.querySelector('[data-count]');
        if (counter) {
          // Start animation when the activity card scrolls into view
          if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver(entries => {
              for (const e of entries) {
                if (e.isIntersecting) {
                  animateCount(counter, contribTotal, 1600);
                  obs.disconnect();
                  break;
                }
              }
            }, { threshold: 0.4 });
            obs.observe(root);
          } else {
            counter.textContent = contribTotal.toLocaleString();
          }
        }
      } else if (events.length) {
        status.innerHTML = `${events.length} recent public event${events.length === 1 ? '' : 's'} · live counts unavailable`;
      } else {
        status.innerHTML = `<span class="dim">live counts unavailable — see <a class="ink" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">github.com/${GITHUB_USER}</a>.</span>`;
      }
    }

    /* ---- populate feed ---- */
    feed.innerHTML = '';
    if (!events.length) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ev-icon">·</span><span><span class="ev-when">—</span><span class="ev-msg dim">no recent public events. most current work lives in private repos — see <a class="ink" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">github.com/${GITHUB_USER}</a>.</span></span>`;
      feed.appendChild(li);
      return;
    }
    events.slice(0, 6).forEach(e => {
      const li = document.createElement('li');
      const when = e.created_at ? relTime(new Date(e.created_at)) : '—';
      const repo = e.repo?.name || 'somewhere';
      const repoUrl = `https://github.com/${repo}`;
      const label = eventLabel(e);
      const icon = eventIcon(e.type);
      let msg = '';
      if (e.type === 'PushEvent' && e.payload?.commits?.length) {
        msg = `<span class="ev-msg">${(e.payload.commits[0].message || '').split('\n')[0].slice(0, 80)}</span>`;
      }
      li.innerHTML = `
        <span class="ev-icon">${icon}</span>
        <span>
          <span class="ev-when">${when}</span> ${label} <a class="ev-repo ink" href="${repoUrl}" target="_blank" rel="noreferrer">${repo}</a>
          ${msg}
        </span>`;
      feed.appendChild(li);
    });
  }

  /* ==========================================================================
     FOOTER WORDMARK — animate the underline draw when the footer enters view
     ========================================================================== */
  function initSignature() {
    const sig = document.querySelector('.foot-sig');
    if (!sig) return;
    if (reduceMotion()) { sig.classList.add('draw'); return; }
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          sig.classList.add('draw');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(sig);
  }

  /* ==========================================================================
     ENTRANCE — curtain that drops on first paint
     ========================================================================== */
  function initEntrance() {
    const el = document.getElementById('entrance');
    if (!el) return;

    if (reduceMotion()) {
      // Skip animation entirely
      el.remove();
      document.body.classList.add('entrance-done');
      return;
    }

    let seen = false;
    try { seen = sessionStorage.getItem('entrance-done') === '1'; } catch {}

    if (seen) {
      el.remove();
      document.body.classList.add('entrance-done');
      return;
    }

    // Wait until the first paint settles, then leave
    const minDuration = 700;
    const startedAt = performance.now();
    const finish = () => {
      const elapsed = performance.now() - startedAt;
      const wait = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        el.classList.add('is-leaving');
        setTimeout(() => {
          document.body.classList.add('entrance-done');
          el.remove();
          try { sessionStorage.setItem('entrance-done', '1'); } catch {}
        }, 480);
      }, wait);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
  }

  /* ==========================================================================
     HERO WORD REVEAL — split text, stagger
     ========================================================================== */
  function initWordReveal() {
    const targets = $$('[data-reveal-words]');
    if (!targets.length) return;

    targets.forEach(target => {
      const stride = 60; // ms between words
      let idx = 0;

      // Walk children: split text nodes into per-word spans, leave element
      // children (em, span.cursor-blink) alone but still wrap their text content.
      const wrapText = (text, startIdx) => {
        const frag = document.createDocumentFragment();
        const parts = text.split(/(\s+)/);
        let i = startIdx;
        parts.forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const wrap = document.createElement('span');
          wrap.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--word-delay', `${i * stride}ms`);
          wrap.appendChild(inner);
          frag.appendChild(wrap);
          i++;
        });
        return { frag, next: i };
      };

      const walk = (node) => {
        const kids = Array.from(node.childNodes);
        for (const kid of kids) {
          if (kid.nodeType === Node.TEXT_NODE) {
            if (!kid.textContent.trim()) continue;
            const { frag, next } = wrapText(kid.textContent, idx);
            idx = next;
            kid.replaceWith(frag);
          } else if (kid.nodeType === Node.ELEMENT_NODE) {
            // Skip the cursor blink — it shouldn't animate as a word
            if (kid.classList?.contains('cursor-blink')) continue;
            walk(kid);
          }
        }
      };

      walk(target);
    });
  }

  /* ==========================================================================
     PINNED PRINCIPLES — sticky scroll stage
     ========================================================================== */
  function initPinnedPrinciples() {
    const section = document.getElementById('principles');
    if (!section || !section.classList.contains('principles-pinned')) return;
    const container = document.getElementById('pinContainer');
    const stage = section.querySelector('.pin-stage');
    const items = $$('.principles > li', section);
    const cur = section.querySelector('.pin-cur');
    const fill = document.getElementById('pinBarFill');
    if (!container || !stage || items.length === 0) return;

    const mq = window.matchMedia('(max-width: 940px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const setActive = (n) => {
      const idx = clamp(n, 0, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      if (cur) cur.textContent = String(idx + 1).padStart(2, '0');
      if (fill) fill.style.width = `${((idx + 1) / items.length) * 100}%`;
      section.classList.toggle('pin-done', idx === items.length - 1);
    };

    const isPinDisabled = () => mq.matches || reduced.matches;

    const onScroll = () => {
      if (isPinDisabled()) {
        items.forEach(el => el.classList.add('is-active'));
        return;
      }
      const rect = container.getBoundingClientRect();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      const stageH = window.innerHeight - headerH;

      const total = container.offsetHeight - stageH;
      const traveled = clamp(-rect.top, 0, total);
      const progress = total > 0 ? (traveled / total) : 0;

      // Map progress to a discrete principle. Use a fractional with rounding so
      // the active item changes near each step boundary.
      const idx = Math.min(items.length - 1, Math.floor(progress * items.length + 0.0001));
      setActive(idx);
    };

    // Initialize: only first item active
    items.forEach((el, i) => el.classList.toggle('is-active', i === 0));
    if (cur) cur.textContent = '01';
    if (fill) fill.style.width = `${(1 / items.length) * 100}%`;

    if (isPinDisabled()) {
      items.forEach(el => el.classList.add('is-active'));
      return;
    }

    let raf = 0;
    const tick = () => {
      raf = 0;
      onScroll();
    };
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    onScroll();

    // React if user toggles reduced-motion / mobile breakpoint mid-session
    const onMq = () => {
      if (isPinDisabled()) {
        items.forEach(el => el.classList.add('is-active'));
      } else {
        onScroll();
      }
    };
    mq.addEventListener?.('change', onMq);
    reduced.addEventListener?.('change', onMq);
  }

  /* ==========================================================================
     SECTION PROGRESS RAIL — right-edge dots
     ========================================================================== */
  function initSectionRail() {
    const rail = document.getElementById('rail');
    if (!rail) return;
    const links = $$('a[data-rail-id]', rail);
    if (!links.length) return;

    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('data-rail-id');
      const target = id ? document.getElementById(id) : null;
      if (target) map.set(target, a);
    });

    const setCurrent = (el) => {
      links.forEach(a => a.removeAttribute('data-current'));
      const a = map.get(el);
      a?.setAttribute('data-current', 'true');
    };

    const obs = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target) setCurrent(visible.target);
    }, {
      threshold: [0.18, 0.4, 0.6],
      rootMargin: '-25% 0px -55% 0px',
    });

    map.forEach((_, el) => obs.observe(el));
  }

  /* ==========================================================================
     CURSOR-FOLLOW CHIP — agency-style hover preview
     ========================================================================== */
  function initCursorChip() {
    const chip = document.getElementById('cursorChip');
    if (!chip) return;
    if (reduceMotion()) return;
    if (matchMedia('(pointer: coarse)').matches) return;

    const text = $('.cc-text', chip);
    const targets = $$('.project, .feature, .stack-card');

    let raf = 0, x = 0, y = 0, tx = 0, ty = 0, active = false;

    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      // Subtle lerp for buttery feel
      x += (tx - x) * 0.32;
      y += (ty - y) * 0.32;
      chip.style.transform = `translate(calc(${x}px - 50%), calc(${y - 28}px - 50%)) scale(${active ? 1 : 0.7})`;
      raf = 0;
      if (active && (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2)) {
        raf = requestAnimationFrame(loop);
      }
    };

    const setActive = (label) => {
      active = !!label;
      if (label && text) text.textContent = label;
      chip.classList.toggle('on', active);
      if (active && !raf) raf = requestAnimationFrame(loop);
    };

    targets.forEach(el => {
      const label = el.classList.contains('feature')
        ? 'Read'
        : el.classList.contains('stack-card')
        ? '—'
        : 'Open';

      el.addEventListener('mouseenter', () => setActive(label));
      el.addEventListener('mouseleave', () => setActive(false));
      el.addEventListener('mousemove', onMove);
    });

    // If user moves outside any target, ensure we lerp the chip back to mouse
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });
  }

  /* ==========================================================================
     SCROLL PROGRESS BAR — top edge, fills as you scroll
     ========================================================================== */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.setProperty('--p', `${p}%`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ==========================================================================
     CARD GLOW + TILT — pointer-tracked highlight + micro 3D
     ========================================================================== */
  function initCardInteractions() {
    if (reduceMotion()) return;
    if (matchMedia('(pointer: coarse)').matches) return;

    const cards = $$('.project, .feature');
    const MAX_TILT = 1.8; // degrees

    cards.forEach(card => {
      let raf = 0;
      let tx = 0, ty = 0, mx = 50, my = 50;

      const apply = () => {
        raf = 0;
        card.style.setProperty('--mx', `${mx}%`);
        card.style.setProperty('--my', `${my}%`);
        card.style.transform = `perspective(900px) rotateX(${tx}deg) rotateY(${ty}deg)`;
      };

      card.addEventListener('mouseenter', () => {
        card.classList.add('is-tilting');
      });

      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        mx = x * 100;
        my = y * 100;
        ty = (x - 0.5) * 2 * MAX_TILT;
        tx = (0.5 - y) * 2 * MAX_TILT;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-tilting');
        // Smooth settle to neutral
        card.style.transform = '';
      });
    });
  }

  /* ==========================================================================
     STAGGER REVEAL — set --si on children, toggle .in-view via IntersectionObserver
     ========================================================================== */
  function initStaggerReveal() {
    const groups = $$('[data-stagger]');
    if (!groups.length) return;

    groups.forEach(group => {
      const kids = Array.from(group.children).filter(c =>
        c.classList?.contains('project') ||
        c.classList?.contains('feature') ||
        c.classList?.contains('reveal')
      );
      kids.forEach((el, i) => el.style.setProperty('--si', String(i)));
    });

    if (reduceMotion()) {
      groups.forEach(g => g.classList.add('in-view'));
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    groups.forEach(g => obs.observe(g));
  }

  /* ==========================================================================
     TERMINAL ACTIVE GLOW — section gets a soft accent halo when in viewport
     ========================================================================== */
  function initTerminalGlow() {
    const section = document.getElementById('shell');
    if (!section) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => section.classList.toggle('is-focus', e.isIntersecting && e.intersectionRatio > 0.3));
    }, { threshold: [0, 0.3, 0.6] });
    obs.observe(section);
  }

  /* ==========================================================================
     LIVE REALFICTION STATUS — real HEAD ping + latency, refreshed every 60s
     ========================================================================== */
  function initLiveRealFiction() {
    const wrap = document.getElementById('liveRF');
    if (!wrap) return;
    const dot = wrap.querySelector('.rf-dot');
    const meta = wrap.querySelector('[data-rf-meta]');

    const setState = (state, text) => {
      if (dot) dot.dataset.rfState = state;
      if (meta) meta.textContent = text;
    };

    const ping = async () => {
      setState('checking', 'pinging…');
      const start = performance.now();
      try {
        // no-cors HEAD: we don't get the body, but the request resolves on success.
        // Cache-busted so we measure live latency.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        await fetch(`https://realfiction.live/?_=${Date.now()}`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const ms = Math.round(performance.now() - start);
        const slow = ms > 800;
        setState(slow ? 'slow' : 'up', `${ms}ms · ${slow ? 'slow' : 'up'}`);
      } catch (err) {
        if (err?.name === 'AbortError') {
          setState('down', 'timeout');
        } else {
          setState('down', 'unreachable');
        }
      }
    };

    ping();
    setInterval(ping, 60_000);
  }

  /* ==========================================================================
     ANIMATED COUNTERS — count up to value when element enters viewport
     ========================================================================== */
  function animateCount(el, to, duration = 1400) {
    if (reduceMotion()) {
      el.textContent = to.toLocaleString();
      return;
    }
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(to * ease(t)).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ==========================================================================
     CONTEXTUAL CURSOR RING — additive polish on fine-pointer devices
     ========================================================================== */
  function initContextCursor() {
    const cursor = document.getElementById('ctxCursor');
    if (!cursor) return;
    if (reduceMotion()) return;
    if (matchMedia('(pointer: coarse)').matches) return;

    let raf = 0, tx = -100, ty = -100, x = -100, y = -100;
    const lerp = (a, b, t) => a + (b - a) * t;

    const loop = () => {
      x = lerp(x, tx, 0.22);
      y = lerp(y, ty, 0.22);
      cursor.style.transform = `translate(${x - 14}px, ${y - 14}px)`;
      if (Math.abs(tx - x) > 0.15 || Math.abs(ty - y) > 0.15) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
    document.addEventListener('mouseenter', () => cursor.classList.add('on'));

    // Update state by what's under the pointer
    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      let state = '';
      if (t.closest('a, button, .btn, [role="button"], summary, .chip, .nav-link, .nav-item, .term-mini, .t-dot, .term-input-line, .iconbtn, .palette-item')) {
        state = 'click';
      } else if (t.closest('.project, .feature, .stack-card, .card.activity, .now')) {
        state = 'card';
      } else if (t.closest('input, textarea, [contenteditable], .term-input, h1, h2, h3, p')) {
        state = 'text';
      }
      cursor.dataset.state = state;
    });
  }

  /* ==========================================================================
     CLICK-TO-SCATTER HERO HEADLINE — words spring outward and settle back
     ========================================================================== */
  function initHeroScatter() {
    const h1 = document.querySelector('.display.reveal-words');
    if (!h1) return;
    if (reduceMotion()) return;

    const scatter = () => {
      if (h1.classList.contains('is-scattering')) return;
      const inners = h1.querySelectorAll('.w > span');
      if (!inners.length) return;
      h1.classList.add('is-scattering');
      inners.forEach((el) => {
        const dx = (Math.random() - 0.5) * 64;
        const dy = (Math.random() - 0.5) * 30;
        const dr = (Math.random() - 0.5) * 18;
        el.style.setProperty('--sx', `${dx}px`);
        el.style.setProperty('--sy', `${dy}px`);
        el.style.setProperty('--sr', `${dr}deg`);
      });
      setTimeout(() => {
        h1.classList.remove('is-scattering');
        inners.forEach(el => {
          el.style.removeProperty('--sx');
          el.style.removeProperty('--sy');
          el.style.removeProperty('--sr');
        });
      }, 1300);
    };

    h1.addEventListener('click', scatter);
    h1.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scatter();
      }
    });
    h1.setAttribute('tabindex', '-1');
  }

  /* ==========================================================================
     LIVE WEB VITALS — real PerformanceObserver values, shown in mono
     ========================================================================== */
  function initWebVitals() {
    const fcpEl = document.querySelector('[data-perf-fcp]');
    const lcpEl = document.querySelector('[data-perf-lcp]');
    const clsEl = document.querySelector('[data-perf-cls]');
    const bytesEl = document.querySelector('[data-perf-bytes]');
    if (!fcpEl && !lcpEl && !clsEl && !bytesEl) return;

    const setVal = (el, label, val, unit = 'ms') => {
      if (!el) return;
      el.innerHTML = `${label} <strong>${val}${unit}</strong>`;
    };

    // FCP
    try {
      const obs = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (e.name === 'first-contentful-paint') {
            setVal(fcpEl, 'fcp', Math.round(e.startTime));
            obs.disconnect();
          }
        }
      });
      obs.observe({ type: 'paint', buffered: true });
    } catch {}

    // LCP
    try {
      let lastLcp = 0;
      const obs = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) lastLcp = Math.round(last.startTime);
        setVal(lcpEl, 'lcp', lastLcp);
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      // Final LCP measure once page is idle
      setTimeout(() => {
        try { obs.takeRecords(); } catch {}
        if (lastLcp) setVal(lcpEl, 'lcp', lastLcp);
      }, 4000);
    } catch {}

    // CLS
    try {
      let cls = 0;
      const obs = new PerformanceObserver(list => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) cls += e.value;
        }
        setVal(clsEl, 'cls', cls.toFixed(3), '');
      });
      obs.observe({ type: 'layout-shift', buffered: true });
    } catch {}

    // JS bytes (sum encoded transfer size of own scripts)
    try {
      const obs = new PerformanceObserver(list => {
        let total = 0;
        for (const e of list.getEntries()) {
          if (e.initiatorType === 'script' && (e.name.endsWith('.js') || e.name.includes('script.js'))) {
            // Prefer encodedBodySize (compressed), fall back to transferSize
            total += e.encodedBodySize || e.transferSize || 0;
          }
        }
        if (total) setVal(bytesEl, 'js', Math.round(total / 1024), 'kb');
      });
      obs.observe({ type: 'resource', buffered: true });
    } catch {}
  }

  /* -------- boot -------- */
  function boot() {
    initHeaderHeight();
    initEntrance();
    initWordReveal();
    initHeroScatter();
    initTheme();
    initYear();
    initLocalTime();
    initCursorGlow();
    initMagnetic();
    initAnchorOffset();
    initActiveSection();
    initSectionRail();
    initScrollProgress();
    initMobileNav();

    const projects = initProjects();
    initCases();
    initPalette(projects);
    initContactCopy();
    initFootTop();
    initReveal();
    initStaggerReveal();
    initKeyboardNav(projects);
    initKonami();

    // New: terminal, signature, github, pinned principles, cursor chip
    initTerminal();
    initTerminalGlow();
    initSignature();
    initGithubActivity();
    initPinnedPrinciples();
    initCursorChip();
    initCardInteractions();

    // Premium polish layer
    initLiveRealFiction();
    initContextCursor();
    initWebVitals();

    consoleSignature();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
