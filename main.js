/* PulseStrap home — scroll story. GSAP + ScrollTrigger. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Intensity meter (state, not decoration): build bars ---------- */
  const ramp = ['#C0BFBF', '#D4B89A', '#E8A050', '#F59A1D', '#F27A0A', '#E04800', '#BF2000'];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rampAt = t => {
    const p = t * (ramp.length - 1), i = Math.min(Math.floor(p), ramp.length - 2), f = p - i;
    const a = hex(ramp[i]), b = hex(ramp[i + 1]);
    return `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], f))).join(',')})`;
  };
  const barsWrap = $('.meter__bars');
  const bars = [];
  for (let i = 0; i < 15; i++) {
    const b = document.createElement('i');
    b.style.height = `${38 + (i / 14) * 62}%`;
    barsWrap.appendChild(b);
    bars.push(b);
  }
  const levelOut = $('[data-level]');
  const setLevel = n => {
    bars.forEach((b, i) => {
      const lit = i < n;
      b.classList.toggle('is-lit', lit);
      b.style.backgroundColor = lit ? rampAt(i / 14) : '';
    });
    levelOut.textContent = `Level ${n}`;
  };
  setLevel(3);

  /* ---------- Where: one word + one photo at a time ---------- */
  const whereWords = $$('[data-where-list] li');
  const whereImgs = $$('[data-where-media] img');
  const whereNote = $('[data-where-note]');
  const notes = ['Up to 120 minutes per charge.', 'Quiet enough for the office.', 'Recover on the couch.', 'Rechargeable. Reusable.'];
  let whereIdx = 0;
  const setWhere = i => {
    if (i === whereIdx) return;
    whereIdx = i;
    whereWords.forEach((w, k) => w.classList.toggle('is-on', k === i));
    whereImgs.forEach((m, k) => m.classList.toggle('is-on', k === i));
    whereNote.textContent = notes[i];
  };

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add(reduce ? 'rm' : 'motion');

  const nav = $('[data-nav]');
  const product = $('[data-product]');
  const card = $('[data-card]');
  const front = $('[data-front]');
  const gel = $('[data-gel]');
  const layerImgs = $$('.layer__img');
  const labels = $$('.product .label');

  /* ---------- 1+2 · Hero → 360° spin → exploded view ---------- */
  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 821px)', mob: '(max-width: 820px)' }, ctx => {
    const { desk } = ctx.conditions;
    const vh = () => window.innerHeight;
    const heroScale = desk ? 1.4 : 1.12;
    const heroY = () => vh() * (desk ? 0.075 : 0.02);
    const endY = () => vh() * (desk ? 0.06 : 0.07);
    const h = () => product.offsetHeight;
    const gap = () => (desk ? h() * 0.6 : 64);

    gsap.set(product, { x: 0, y: heroY, rotation: -10, scale: heroScale });
    gsap.set(card, { rotationX: 0 });
    gsap.set(layerImgs, { opacity: 0 });
    gsap.set(labels, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: reduce });
    tl.to('[data-hero]', { y: () => -vh() * 0.16, opacity: 0, duration: 1.8, ease: 'power1.in' }, 0.25)
      .to('.stage__orange', { opacity: 0, duration: 2.8, ease: 'sine.inOut' }, 0.4)
      .to('.floor', { opacity: 0, duration: 1.2 }, 0.3)
      // the spin: one full turn around the strap's long axis, showing the electrodes halfway
      .to(card, { rotationX: 360, duration: 3.4, ease: 'power2.inOut' }, 0.4)
      // ...while it shrinks, levels out and drops into the next section
      .to(product, { scale: 1, rotation: 0, y: endY, duration: 3.4, ease: 'power2.inOut' }, 0.4)
      .fromTo('[data-meet]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, 2.5)
      .set(layerImgs, { opacity: 1 }, 4.2)
      .to(front, { y: () => -(h() + gap()), duration: 2.4, ease: 'power3.inOut' }, 4.3)
      .to(gel, { y: () => h() + gap(), duration: 2.4, ease: 'power3.inOut' }, 4.3)
      .fromTo(labels, { opacity: 0, y: desk ? 0 : 8 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.3, ease: 'power2.out' }, 5.7)
      .to({}, { duration: 1.6 });

    const st = ScrollTrigger.create({
      trigger: '[data-story]',
      start: 'top top',
      end: 'bottom bottom',
      animation: reduce ? null : tl,
      scrub: reduce ? false : 0.9,
      invalidateOnRefresh: true,
      onUpdate: self => {
        product.classList.toggle('is-idle', !reduce && self.progress < 0.015);
        // Reduced motion: no travel, just two complete states.
        if (reduce) tl.progress(self.progress > 0.3 ? 1 : 0);
      }
    });
    product.classList.toggle('is-idle', !reduce);
    return () => { st.kill(); tl.kill(); };
  });

  /* ---------- 3 · Ritual: vertical scroll drives the steps sideways ---------- */
  if (!reduce) {
    const track = $('[data-track]');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '[data-ritual]',
        start: 'top top',
        end: () => '+=' + dist() * 1.1,
        pin: '.ritual__pin',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
  }

  /* ---------- 4 · Where ---------- */
  ScrollTrigger.create({
    trigger: '[data-where]',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => setWhere(Math.min(3, Math.floor(self.progress * 4)))
  });

  /* ---------- 5 · Meter fills with scroll: level 1 → 15 ---------- */
  ScrollTrigger.create({
    trigger: '[data-meter]',
    start: 'top 88%',
    end: 'top 38%',
    scrub: true,
    onUpdate: self => setLevel(Math.max(1, Math.round(self.progress * 15)))
  });

  /* ---------- Section headings: one quiet rise, headings only ---------- */
  if (!reduce) {
    $$('.reveal').forEach(el => {
      gsap.from(el, { y: 48, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    // The strap comes back for the close, turning as the page goes dark.
    gsap.fromTo('[data-end-strap]', { rotation: -16, yPercent: -20 }, {
      rotation: 8, yPercent: 60, ease: 'none',
      scrollTrigger: { trigger: '.end', start: 'top bottom', end: 'center center', scrub: true }
    });
  }

  /* ---------- Nav + mobile buy bar states ---------- */
  const buybar = $('[data-buybar]');
  const storyEl = $('[data-story]');
  const shopEl = $('#shop');
  const endCta = $('.end__cta');
  const updateChrome = () => {
    const y = window.scrollY, vh = window.innerHeight;
    const onOrange = y < vh * 0.45;
    const endTop = endCta.getBoundingClientRect().top;
    const onDark = endTop < 72;
    nav.classList.toggle('is-on-orange', onOrange);
    nav.classList.toggle('is-on-dark', onDark);
    nav.classList.toggle('is-solid', !onOrange && !onDark && y > storyEl.offsetHeight - vh);
    const s = shopEl.getBoundingClientRect();
    const shopInView = s.top < vh && s.bottom > 0;
    buybar.classList.toggle('is-on', y > storyEl.offsetHeight - vh * 0.5 && !shopInView && endTop > vh);
  };
  window.addEventListener('scroll', updateChrome, { passive: true });
  window.addEventListener('resize', updateChrome);
  updateChrome();
})();
