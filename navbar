$(document).ready(function () {

  // ─── CURSOR ──────────────────────────────────────────────────────────────────

 function initCursor($cursor, $targets) {
    let leaveTimer = null;
    let pinned     = null;
    let hoveredEl  = null; // ← añadir esto

    function snapCursor($el) {
      clearTimeout(leaveTimer);
      var width  = $el.outerWidth();
      var height = $el.outerHeight();
      var top    = $el.offset().top - $(document).scrollTop() + height / 2;
      var left   = $el.offset().left + width / 2;
      $cursor.css({ top: top + 'px', left: left + 'px', width: width + 'px', height: height + 'px', opacity: 1 });
    }

    function releaseCursor() {
      if (pinned) return;
      if (hoveredEl) return; // ← no ocultar si hay algo hovered
      $cursor.css('opacity', 0);
      leaveTimer = setTimeout(function () {
        $cursor.css({ width: '', height: '' });
      }, 400);
    }

    $targets.mouseenter(function () {
      hoveredEl = this; // ← registrar
      snapCursor($(this));
    });

    $targets.mouseleave(function () {
      hoveredEl = null; // ← limpiar
      if (pinned && $(this).is(pinned)) return;
      releaseCursor();
    });

    return {
      pin: function ($el) {
        pinned = $el;
        snapCursor($el);
      },
      unpin: function () {
        pinned = null;
        releaseCursor(); // ahora respeta hoveredEl
      },
    };
  }

  var cursor1 = initCursor($('.navbar_cursor.is-variant-1'), $('.dynamic-hover'));
  initCursor($('.navbar_cursor.is-variant-2'), $('.dynamic-hover-2'));
  initCursor($('.navbar_cursor.is-variant-3'), $('.dynamic-hover-3'));


  // ─── MEGA NAV ────────────────────────────────────────────────────────────────

  function initMegaNav() {
    const DUR = {
      bgMorph:     0.4,
      contentIn:   0.3,
      contentOut:  0.2,
      stagger:     0.25,
      backdropIn:  0.3,
      backdropOut: 0.2,
      openScale:   0.35,
      closeScale:  0.25,
      arrowMorph:  0.35,
    };

    const ARROW_DOWN = 'M3.5 5.83301L7 9.33301L10.5 5.83301';
    const ARROW_UP   = 'M3.5 9.33301L7 5.83301L10.5 9.33301';

    const HOVER_ENTER = 120;
    const HOVER_LEAVE = 150;

    // DOM references
    const menuWrap      = document.querySelector('[data-menu-wrap]');
    const dropWrapper   = document.querySelector('[data-dropdown-wrapper]');
    const dropContainer = document.querySelector('[data-dropdown-container]');
    const backdrop      = document.querySelector('[data-menu-backdrop]');
    const toggles       = [...document.querySelectorAll('[data-dropdown-toggle]')];
    const panels        = [...document.querySelectorAll('[data-nav-content]')];

    // State
    const state = {
      isOpen:           false,
      activePanel:      null,
      activePanelIndex: -1,
      hoverTimer:       null,
      leaveTimer:       null,
      tl:               null,
    };

    // Helpers
    const getPanel  = (name) => document.querySelector(`[data-nav-content="${name}"]`);
    const getToggle = (name) => document.querySelector(`[data-dropdown-toggle="${name}"]`);
    const getFade   = (el)   => el.querySelectorAll('[data-menu-fade]');
    const getIndex  = (name) => toggles.indexOf(getToggle(name));
    const stagger   = (n)    => (n <= 1 ? 0 : { amount: DUR.stagger });

    // Arrow morph helpers
    function getArrowPath(toggle) {
      return toggle ? toggle.querySelector('.navbar_link-icon svg path') : null;
    }

    function morphArrowUp(toggle) {
      const path = getArrowPath(toggle);
      if (!path) return;
      gsap.to(path, { attr: { d: ARROW_UP }, duration: DUR.arrowMorph, ease: 'power2.inOut' });
    }

    function morphArrowDown(toggle) {
      const path = getArrowPath(toggle);
      if (!path) return;
      gsap.to(path, { attr: { d: ARROW_DOWN }, duration: DUR.arrowMorph, ease: 'power2.inOut' });
    }

    // Cursor helpers
    function pinCursor(panelName) {
      const toggle = getToggle(panelName);
      if (toggle) cursor1.pin($(toggle));
    }

    function unpinCursor() {
      cursor1.unpin();
    }

    function killTl() {
      if (state.tl) { state.tl.kill(); state.tl = null; }
    }

    function killDropdown() {
      killTl();
      gsap.killTweensOf(dropContainer);
      gsap.killTweensOf(backdrop);
      panels.forEach((p) => {
        gsap.killTweensOf(p);
        gsap.killTweensOf(getFade(p));
      });
    }

    function resetToggles() {
      toggles.forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        // Reset all arrows to down on full reset
        morphArrowDown(t);
      });
    }

    function resetDesktop() {
      panels.forEach((p) => {
        gsap.set(p, { autoAlpha: 0, pointerEvents: 'none', xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(dropContainer, { height: 0 });
      gsap.set(backdrop, { autoAlpha: 0 });
      menuWrap.setAttribute('data-menu-open', 'false');
      resetToggles();
    }

    function measurePanel(name) {
      const el = getPanel(name);
      if (!el) return 0;
      const s = el.style;
      const prev = [s.visibility, s.opacity, s.pointerEvents];
      Object.assign(s, { visibility: 'visible', opacity: '0', pointerEvents: 'none' });
      const h = el.getBoundingClientRect().height;
      [s.visibility, s.opacity, s.pointerEvents] = prev;
      return h;
    }

    // Open dropdown (first open)
    function openDropdown(panelName) {
      if (state.isOpen && state.activePanel === panelName) return;
      if (state.isOpen) return switchPanel(state.activePanel, panelName);

      const height = measurePanel(panelName);
      if (!height) return;

      killDropdown();
      resetDesktop();

      const el     = getPanel(panelName);
      const fade   = getFade(el);
      const toggle = getToggle(panelName);

      state.isOpen           = true;
      state.activePanel      = panelName;
      state.activePanelIndex = getIndex(panelName);
      menuWrap.setAttribute('data-menu-open', 'true');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');

      morphArrowUp(toggle);
      pinCursor(panelName);

      const tl = gsap.timeline();
      state.tl = tl;

      tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: 'power2.out' }, 0);
      tl.to(dropContainer, { height, duration: DUR.openScale, ease: 'power3.out' }, 0);
      tl.set(el, { pointerEvents: 'auto' }, 0);
      tl.to(el, { autoAlpha: 1, duration: DUR.contentIn, ease: 'power2.out' }, 0.05);
      if (fade.length) {
        tl.fromTo(
          fade,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: DUR.contentIn, stagger: stagger(fade.length), ease: 'power3.out' },
          0.1
        );
      }
    }

    // Close dropdown
    function closeDropdown() {
      if (!state.isOpen) return;
      const el     = getPanel(state.activePanel);
      const fade   = el ? getFade(el) : [];
      const toggle = getToggle(state.activePanel);

      killDropdown();
      morphArrowDown(toggle);
      unpinCursor();

      const tl = gsap.timeline({
        onComplete() {
          state.isOpen           = false;
          state.activePanel      = null;
          state.activePanelIndex = -1;
          state.tl               = null;
          resetDesktop();
        },
      });
      state.tl = tl;

      if (fade.length) tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: 'power2.in' }, 0);
      if (el) tl.to(el, { autoAlpha: 0, duration: DUR.contentOut, ease: 'power2.in' }, 0);
      tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: 'power2.in' }, 0.05);
      tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: 'power2.out' }, 0);
      if (el) tl.set(el, { pointerEvents: 'none' });
    }

    // Switch panel (directional)
    function switchPanel(fromName, toName) {
      const dir    = getIndex(toName) > getIndex(fromName) ? 1 : -1;
      const fromEl = getPanel(fromName);
      const toEl   = getPanel(toName);
      if (!fromEl || !toEl) return;

      const fromFade   = getFade(fromEl);
      const toFade     = getFade(toEl);
      const toHeight   = measurePanel(toName);
      const fromToggle = getToggle(fromName);
      const toToggle   = getToggle(toName);
      if (!toHeight) return;

      killDropdown();

      panels.forEach((p) => {
        gsap.set(p, { autoAlpha: 0, pointerEvents: 'none', xPercent: 0 });
        gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
      });
      gsap.set(fromEl, { autoAlpha: 1, pointerEvents: 'auto', x: 0 });
      if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
      gsap.set(backdrop, { autoAlpha: 1 });

      state.activePanel      = toName;
      state.activePanelIndex = getIndex(toName);
      resetToggles();
      if (toToggle) toToggle.setAttribute('aria-expanded', 'true');

      // Morph from arrow down, to arrow up
      morphArrowDown(fromToggle);
      morphArrowUp(toToggle);
      pinCursor(toName);

      const xOut = dir * -30;
      const xIn  = dir *  30;

      const tl = gsap.timeline();
      state.tl = tl;

      if (fromFade.length) tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: 'power2.in' }, 0);
      tl.to(fromEl, { autoAlpha: 0, duration: DUR.contentOut, ease: 'power2.in' }, 0);
      tl.set(fromEl, { pointerEvents: 'none', xPercent: 0 }, DUR.contentOut);
      if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);

      tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: 'power3.out' }, 0.05);

      tl.set(toEl, { pointerEvents: 'auto', xPercent: 0 }, DUR.contentOut * 0.5);
      tl.to(toEl, { autoAlpha: 1, duration: DUR.contentIn, ease: 'power2.out' }, DUR.contentOut * 0.5);
      if (toFade.length) {
        tl.fromTo(
          toFade,
          { autoAlpha: 0, x: xIn },
          { autoAlpha: 1, x: 0, duration: DUR.contentIn, stagger: stagger(toFade.length), ease: 'power3.out' },
          DUR.contentOut * 0.6
        );
      }
    }

    // Hover intent handlers
    function handleToggleEnter(e) {
      const name   = e.currentTarget.getAttribute('data-dropdown-toggle');
      const toggle = e.currentTarget;
      if (!name) return;
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
      clearTimeout(state.hoverTimer);
      // Morph arrow up immediately on hover (before panel opens)
      morphArrowUp(toggle);
      state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
    }

    function handleToggleLeave(e) {
      const toggle = e.currentTarget;
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
      // Only morph back if this toggle's panel is not the active one
      if (!state.isOpen || state.activePanel !== toggle.getAttribute('data-dropdown-toggle')) {
        morphArrowDown(toggle);
      }
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }

    function handleWrapperEnter() {
      clearTimeout(state.leaveTimer);
      state.leaveTimer = null;
    }

    function handleWrapperLeave() {
      state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
    }

    // Keyboard handlers
    function handleEscape(e) {
      if (e.key !== 'Escape' || !state.isOpen) return;
      const t = getToggle(state.activePanel);
      closeDropdown();
      if (t) t.focus();
    }

    function handleDocClick(e) {
      if (!state.isOpen) return;
      if (!e.target.closest('[data-menu-wrap]')) closeDropdown();
    }

    function focusFirstLink(panelName) {
      setTimeout(() => {
        const el = getPanel(panelName);
        if (!el) return;
        const link = el.querySelector('a');
        if (link) link.focus();
      }, 80);
    }

    function handleKeydownOnToggle(e) {
      const name = e.currentTarget.getAttribute('data-dropdown-toggle');
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.isOpen && state.activePanel === name) closeDropdown();
        else { openDropdown(name); focusFirstLink(name); }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!state.isOpen || state.activePanel !== name) openDropdown(name);
        focusFirstLink(name);
      }
      if (e.key === 'Tab' && !e.shiftKey && state.isOpen && state.activePanel === name) {
        e.preventDefault();
        const link = getPanel(name)?.querySelector('a');
        if (link) link.focus();
      }
    }

    function handleKeydownInPanel(e) {
      if (!state.isOpen) return;
      const el = getPanel(state.activePanel);
      if (!el) return;

      const links = [...el.querySelectorAll('a')];
      const idx   = links.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') { e.preventDefault(); links[(idx + 1) % links.length].focus(); }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx <= 0) { const t = getToggle(state.activePanel); if (t) t.focus(); }
        else links[idx - 1].focus();
      }
      if (e.key === 'Tab' && !e.shiftKey && idx === links.length - 1) {
        e.preventDefault();
        const curIdx = toggles.indexOf(getToggle(state.activePanel));
        const next   = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
        closeDropdown();
        if (next) next.focus();
      }
      if (e.key === 'Tab' && e.shiftKey && idx === 0) {
        e.preventDefault();
        const t = getToggle(state.activePanel);
        if (t) t.focus();
      }
    }

    // Event binding
    toggles.forEach((btn) => {
      btn.addEventListener('mouseenter', handleToggleEnter);
      btn.addEventListener('mouseleave', handleToggleLeave);
      btn.addEventListener('keydown', handleKeydownOnToggle);
    });
    dropWrapper.addEventListener('mouseenter', handleWrapperEnter);
    dropWrapper.addEventListener('mouseleave', handleWrapperLeave);
    panels.forEach((p) => p.addEventListener('keydown', handleKeydownInPanel));
    backdrop.addEventListener('click', closeDropdown);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleDocClick);

    // Init
    resetDesktop();
  }

  initMegaNav();

});

