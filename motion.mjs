import Lenis from './assets/lenis.mjs';

const easeOut = 'cubic-bezier(.23, 1, .32, 1)';
const easeReveal = 'cubic-bezier(.16, 1, .3, 1)';

export function createMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(min-width: 768px) and (pointer: fine)');
  const activeAnimations = new Set();
  const dialogAnimations = new WeakMap();
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  const photo = document.querySelector('.hero-photo');
  let parallaxFrame = 0;
  let keyboard = false;

  const lenis = new Lenis({
    autoRaf: true,
    lerp: .1,
    smoothWheel: true,
    syncTouch: false,
    anchors: false,
    respectReducedMotion: true,
    stopInertiaOnNavigate: true,
    prevent: node => node.matches('input, textarea, select, dialog, [data-lenis-prevent]'),
  });

  function track(animation) {
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    return animation;
  }

  function scrollTo(target, { instant = false, onComplete } = {}) {
    const top = target === document.getElementById('main');
    lenis.scrollTo(top ? 0 : target, {
      offset: top ? 0 : -(header.offsetHeight + 22),
      immediate: instant || reduced.matches || keyboard,
      onComplete,
    });
  }

  function setInput(event) {
    if (event.type === 'keydown') {
      keyboard = true;
      document.documentElement.dataset.input = 'keyboard';
    } else {
      keyboard = false;
      document.documentElement.dataset.input = 'pointer';
    }
  }
  document.addEventListener('keydown', setInput, true);
  document.addEventListener('pointerdown', setInput, true);

  function animateReveal(element, delay = 0) {
    if (reduced.matches || !element.animate) return;
    track(element.animate(
      [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 600, delay, fill: 'backwards', easing: easeReveal },
    ));
  }

  const revealObserver = new IntersectionObserver(entries => {
    const entering = entries.filter(entry => entry.isIntersecting).map(entry => entry.target);
    entering.forEach((element, index) => {
      revealObserver.unobserve(element);
      animateReveal(element, Math.min(index, 3) * 50);
    });
  }, { threshold: .08 });
  document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
  document.querySelectorAll('[data-hero-reveal]').forEach((element, index) => animateReveal(element, index * 50));

  function renderParallax() {
    parallaxFrame = 0;
    if (!photo || !hero) return;
    if (reduced.matches || !finePointer.matches) {
      photo.style.removeProperty('transform');
      return;
    }
    const bounds = hero.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const distance = Math.max(-70, Math.min(70, -bounds.top * .12));
    photo.style.transform = 'translate3d(0,' + distance + 'px,0)';
  }
  function updateScrollState() {
    header.classList.toggle('is-scrolled', scrollY > 8);
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(renderParallax);
  }
  lenis.on('scroll', updateScrollState);
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  function syncDialogScroll() {
    if (document.querySelector('dialog[open]')) lenis.stop();
    else lenis.start();
  }
  const dialogObserver = new MutationObserver(syncDialogScroll);
  document.querySelectorAll('dialog').forEach(dialog => dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));

  function openDialog(dialog, event) {
    dialogAnimations.get(dialog)?.cancel();
    dialogAnimations.delete(dialog);
    if (!dialog.open) dialog.showModal();
    lenis.stop();
    if (reduced.matches || keyboard || event?.detail === 0 || !dialog.animate) return;
    const animation = track(dialog.animate(
      [{ opacity: 0, transform: 'translateY(8px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
      { duration: 220, easing: easeOut },
    ));
    dialogAnimations.set(dialog, animation);
  }

  function closeDialog(dialog, { instant = false } = {}) {
    if (!dialog.open) return;
    dialogAnimations.get(dialog)?.cancel();
    dialogAnimations.delete(dialog);
    if (instant || reduced.matches || keyboard || !dialog.animate) {
      dialog.close();
      syncDialogScroll();
      return;
    }
    const animation = track(dialog.animate(
      [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(5px) scale(.98)' }],
      { duration: 140, easing: easeOut, fill: 'forwards' },
    ));
    dialogAnimations.set(dialog, animation);
    animation.finished.then(() => {
      if (dialogAnimations.get(dialog) !== animation) return;
      dialogAnimations.delete(dialog);
      dialog.close();
      animation.cancel();
      syncDialogScroll();
    }).catch(() => {});
  }

  function handleAnchor(event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.target === '_blank') return;
    let id;
    try { id = decodeURIComponent(link.getAttribute('href').slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', '#' + encodeURIComponent(id));
    scrollTo(target, {
      instant: event.detail === 0,
      onComplete: () => {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
        target.focus({ preventScroll: true });
      },
    });
  }
  document.addEventListener('click', handleAnchor);

  document.querySelectorAll('.faq-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      lenis.resize();
      if (!details.open || reduced.matches || keyboard) return;
      const answer = details.querySelector('.faq-answer');
      if (answer?.animate) track(answer.animate(
        [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 180, easing: easeOut },
      ));
    });
  });

  function preferencesChanged() {
    if (reduced.matches) activeAnimations.forEach(animation => animation.cancel());
    renderParallax();
  }
  reduced.addEventListener('change', preferencesChanged);
  finePointer.addEventListener('change', renderParallax);

  return {
    scrollTo,
    openDialog,
    closeDialog,
    destroy() {
      lenis.destroy();
      revealObserver.disconnect();
      dialogObserver.disconnect();
      activeAnimations.forEach(animation => animation.cancel());
      if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
      reduced.removeEventListener('change', preferencesChanged);
      finePointer.removeEventListener('change', renderParallax);
      window.removeEventListener('scroll', updateScrollState);
      document.removeEventListener('click', handleAnchor);
      document.removeEventListener('keydown', setInput, true);
      document.removeEventListener('pointerdown', setInput, true);
    },
  };
}
