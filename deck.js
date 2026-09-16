(() => {
  const params = new URLSearchParams(window.location.search);
  const requestedTheme = params.get('theme');
  if (requestedTheme === 'dark' || requestedTheme === 'light') {
    document.body.dataset.theme = requestedTheme;
  }

  // Booth chrome (logo + CNCF mark) lives inside every slide so it scales with
  // the deck. The markup is defined once in a <template> and cloned per slide.
  // A fixed-size frame keeps the content, chrome, and footer aligned while
  // Reveal scales the 1920x1080 canvas to the display.
  // Select leaf slides only: a nested <section> is a Reveal vertical stack whose
  // wrapper must stay chrome-free, so we skip any section that contains another.
  const chrome = document.getElementById('deck-chrome');
  const defaultDescriptor = 'Kubernetes multi-tenancy';
  document.querySelectorAll('.slides section:not(:has(section))').forEach((slide) => {
    const footer = slide.querySelector('.slide-footer');
    const frame = document.createElement('div');
    frame.className = 'slide-frame';
    const body = document.createElement('div');
    body.className = 'slide-body';
    for (const child of [...slide.children]) {
      if (child !== footer) body.append(child);
    }

    const node = chrome.content.firstElementChild.cloneNode(true);
    node.querySelector('.brand__descriptor').textContent =
      slide.dataset.brandDescriptor || defaultDescriptor;
    frame.append(node, body);
    if (footer) frame.append(footer);
    slide.append(frame);
  });

  // Autoplay: ?seconds=N sets the interval (min 6s), ?autoplay=0 starts static.
  const seconds = Math.max(6, Number(params.get('seconds')) || 10);
  const autoSlide = params.get('autoplay') === '0' ? 0 : seconds * 1000;

  Reveal.initialize({
    width: 1920,
    height: 1080,
    margin: 0,
    minScale: 0.2,
    maxScale: 2,
    center: false,
    controls: true,
    controlsTutorial: false,
    progress: true,
    hash: true,
    transition: 'fade',
    backgroundTransition: 'fade',
    loop: true,
    autoSlide,
    // Auto-advance horizontally only, skipping vertical slides. Wrapped in an
    // arrow so it resolves at call time: Reveal.navigateRight isn't attached to
    // the global until initialize() runs, so referencing it directly here would
    // be undefined and autoplay would fall back to navigateNext (which descends
    // into vertical slides).
    autoSlideMethod: () => Reveal.navigateRight(),
    autoSlideStoppable: true,
    hideInactiveCursor: true,
    hideCursorTime: 1500,
    // Rebind the vertical arrow keys so they step out of a vertical stack at its
    // ends instead of looping within it (loop:true makes the up/down routes
    // always available, so the stock navigateUp/navigateDown wrap to the other
    // end of the same stack). Combined with data-start-indexv="0" on the stack
    // (index.html), moving between slides always lands on a stack's top slide.
    keyboard: {
      // Down: navigateNext descends through the stack and, once on the last
      // vertical slide, advances to the next horizontal slide instead of
      // wrapping back to the top (it has a built-in loop guard for this).
      40: 'next',
      // Up: the symmetric counterpart. navigatePrev can't be reused here — it
      // lacks that loop guard and would wrap to the bottom of the current stack
      // from the top slide. So ascend while there's room above, otherwise step
      // to the previous horizontal slide (landing on its top via start-indexv).
      //38: () => (Reveal.getIndices().v > 0 ? Reveal.up() : Reveal.left()),
      38: 'prev',
    },
  });

  // Persistent "there's more below" hint. Vertical stacks otherwise look like a
  // single slide, so whenever the current slide sits above another vertical
  // slide we show a faint down chevron in the bottom-right corner (styles.css),
  // which steps aside for Reveal's real controls once the visitor is active.
  // It's a dedicated element rather than Reveal's own down arrow: loop:true
  // keeps that arrow "enabled" everywhere, and Reveal re-animates it on every
  // slide change (which made a reused arrow flash). "Is there a slide below" is
  // read from the DOM — a leaf slide inside a vertical stack has a following
  // <section> sibling exactly when another vertical slide sits beneath it — and
  // exposed as a body class the stylesheet keys off.
  // The chevron mirrors Reveal's own down-control markup and geometry (styles.css
  // replicates its em-based bars and bottom-right anchor) so that when the real
  // controls take over on activity, it reads as the very same arrow.
  const belowHint = document.createElement('div');
  belowHint.className = 'deck-below-hint';
  belowHint.setAttribute('aria-hidden', 'true');
  belowHint.innerHTML =
    '<span class="deck-below-hint__btn"><span class="deck-below-hint__arrow"></span></span>';
  document.querySelector('.reveal').append(belowHint);

  const updateBelowHint = () => {
    const current = Reveal.getCurrentSlide();
    const inStack = current && current.parentElement.matches('.slides > section');
    const hasBelow = !!(inStack && current.nextElementSibling);
    document.body.classList.toggle('has-slide-below', hasBelow);
  };
  Reveal.on('ready', updateBelowHint);
  Reveal.on('slidechanged', updateBelowHint);

  // Reveal's controls and progress bar are hidden by default (see styles.css) and
  // revealed only while the visitor is actively pointing at the deck. Pointer
  // movement (or touch) shows them; they fade back out after a short idle delay.
  // Keyboard navigation deliberately does not reveal them.
  const chromeIdleMs = 2500;
  let chromeTimer;
  const hideChrome = () => document.body.classList.remove('deck-chrome-active');
  const showChrome = () => {
    document.body.classList.add('deck-chrome-active');
    clearTimeout(chromeTimer);
    chromeTimer = setTimeout(hideChrome, chromeIdleMs);
  };
  for (const type of ['pointermove', 'pointerdown', 'touchstart']) {
    document.addEventListener(type, showChrome, { passive: true });
  }

  // autoSlideStoppable pauses autoplay the moment a visitor touches the deck.
  // On an unattended booth we want it to pick itself back up, so resume autoplay
  // after ~1 minute without input. Skipped entirely when autoplay is disabled
  // (?autoplay=0) so a manually-driven deck stays static.
  if (autoSlide > 0) {
    const idleMs = 60 * 1000;
    let idleTimer;
    const resume = () => {
      if (!Reveal.isAutoSliding()) Reveal.toggleAutoSlide(true);
    };
    // pointermove can fire dozens of times per second; throttle so we only
    // reset the idle timer at most once per second.
    let lastNudge = 0;
    const nudge = () => {
      const now = Date.now();
      if (now - lastNudge < 1000) return;
      lastNudge = now;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(resume, idleMs);
    };
    for (const type of ['keydown', 'pointermove', 'pointerdown', 'wheel', 'touchstart']) {
      document.addEventListener(type, nudge, { passive: true });
    }
    nudge();
  }
})();
