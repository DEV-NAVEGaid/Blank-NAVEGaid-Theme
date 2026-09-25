(function () {
  function initInstance(sectionEl) {
    if (!sectionEl || sectionEl.dataset.testimonialSliderInitialized === 'true') return;
    const sectionIdAttr = sectionEl.dataset.sectionId;
    if (!sectionIdAttr) return;

    const track = sectionEl.querySelector('.nvgd-ts-track');
    const trackWindow = sectionEl.querySelector('.nvgd-ts-track-window');
    const prevBtn = sectionEl.querySelector('.nvgd-ts-prev');
    const nextBtn = sectionEl.querySelector('.nvgd-ts-next');

    if (!track || !trackWindow || !prevBtn || !nextBtn) return;
    sectionEl.dataset.testimonialSliderInitialized = 'true';

    const abortController = new AbortController();
    const { signal } = abortController;
    let animTimeout = null;
    let resizeTimer = null;

    document.addEventListener('shopify:section:unload', function onUnload(event) {
      if (event.detail && event.detail.sectionId === sectionIdAttr) {
        abortController.abort();
        clearTimeout(animTimeout);
        clearTimeout(resizeTimer);
      }
    }, { signal });

    /* ══════════════════════════════════════
       Clean up any clones from previous init
       ══════════════════════════════════════ */
    track.querySelectorAll('[data-clone="true"]').forEach((el) => el.remove());

    const originalSlides = Array.from(track.children);
    const originalCount = originalSlides.length;
    if (originalCount === 0) return;

    /* ══════════════════════════════════════
       Video array from blocks & Popup setup
       ══════════════════════════════════════ */
    const shopConfig = {
      text: sectionEl.dataset.popupShopText || 'Shop',
      url: sectionEl.dataset.popupShopUrl || ''
    };

    const videos = [];
    const cardToVideoIndex = {};
    originalSlides.forEach((slide, cardIndex) => {
      const box = slide.querySelector('.nvgd-ts-video-box');
      const videoUrl = box?.dataset.videoUrl;
      if (!videoUrl) return;

      cardToVideoIndex[cardIndex] = videos.length;
      videos.push({
        title: box.dataset.videoTitle || 'Video',
        description: box.dataset.videoDescription || '',
        videoUrl
      });
    });

    track.addEventListener('click', (ev) => {
      const box = ev.target.closest('.nvgd-ts-video-box');
      if (!box) return;
      const cardIdx = parseInt(box.getAttribute('data-card-index'), 10);
      const popupIdx = cardToVideoIndex[cardIdx];
      if (popupIdx !== undefined && window.NVGDVideoPopup) {
        window.NVGDVideoPopup.init(videos, shopConfig);
        window.NVGDVideoPopup.open(popupIdx);
      }
    }, { signal });

    /* ══════════════════════════════════════
       Single Slide Guard
       ══════════════════════════════════════ */
    if (originalCount <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      track.style.transition = 'none';
      track.style.transform = 'none';
      return;
    }
    prevBtn.style.display = '';
    nextBtn.style.display = '';

    /* ══════════════════════════════════════
       Infinite Loop Clone Creation
       ══════════════════════════════════════ */
    const cloneMultiplier = originalCount < 3 ? Math.ceil(3 / originalCount) : 1;
    const prefixClones = [];
    const suffixClones = [];

    for (let m = 0; m < cloneMultiplier; m++) {
      originalSlides.forEach((slide) => {
        const cloneBefore = slide.cloneNode(true);
        cloneBefore.setAttribute('data-clone', 'true');
        cloneBefore.setAttribute('aria-hidden', 'true');
        cloneBefore.querySelectorAll('a, button, input').forEach((el) => el.setAttribute('tabindex', '-1'));
        prefixClones.push(cloneBefore);

        const cloneAfter = slide.cloneNode(true);
        cloneAfter.setAttribute('data-clone', 'true');
        cloneAfter.setAttribute('aria-hidden', 'true');
        cloneAfter.querySelectorAll('a, button, input').forEach((el) => el.setAttribute('tabindex', '-1'));
        suffixClones.push(cloneAfter);
      });
    }

    prefixClones.forEach((clone) => track.insertBefore(clone, originalSlides[0]));
    suffixClones.forEach((clone) => track.appendChild(clone));

    const totalPrefixCount = prefixClones.length;
    let currentIndex = totalPrefixCount;
    let isAnimating = false;

    const getStep = () => {
      const firstSlide = track.querySelector('.nvgd-ts-slide');
      if (!firstSlide) return 0;
      const slideWidth = firstSlide.getBoundingClientRect().width;
      const computed = window.getComputedStyle(track);
      const g = parseFloat(computed.gap || computed.columnGap);
      const gap = isNaN(g) ? (parseFloat(sectionEl.dataset.slideGap) || 20) : g;
      return slideWidth + gap;
    };

    const updateTransform = (animated) => {
      const step = getStep();
      const offset = currentIndex * step;
      if (animated) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        track.style.transition = 'none';
      }
      track.style.transform = `translate3d(-${offset}px, 0, 0)`;
    };

    const virtualTotal = originalCount * cloneMultiplier;

    const handleBoundaryReset = () => {
      isAnimating = false;
      if (animTimeout) {
        clearTimeout(animTimeout);
        animTimeout = null;
      }

      if (currentIndex >= totalPrefixCount + virtualTotal) {
        currentIndex -= virtualTotal;
        updateTransform(false);
        void track.offsetWidth;
      } else if (currentIndex < totalPrefixCount) {
        currentIndex += virtualTotal;
        updateTransform(false);
        void track.offsetWidth;
      }
    };

    track.addEventListener('transitionend', (ev) => {
      if (ev.target !== track || ev.propertyName !== 'transform') return;
      handleBoundaryReset();
    }, { signal });

    const nextSlide = () => {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex++;
      updateTransform(true);

      clearTimeout(animTimeout);
      animTimeout = setTimeout(() => {
        if (isAnimating) handleBoundaryReset();
      }, 480);
    };

    const prevSlide = () => {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex--;
      updateTransform(true);

      clearTimeout(animTimeout);
      animTimeout = setTimeout(() => {
        if (isAnimating) handleBoundaryReset();
      }, 480);
    };

    nextBtn.addEventListener('click', nextSlide, { signal });
    prevBtn.addEventListener('click', prevSlide, { signal });

    /* ══════════════════════════════════════
       Touch / Swipe
       ══════════════════════════════════════ */
    let touchStartX = 0;
    let touchDistanceX = 0;
    const minSwipeDistance = 40;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchDistanceX = 0;
    }, { passive: true, signal });

    track.addEventListener('touchmove', (e) => {
      touchDistanceX = e.touches[0].clientX - touchStartX;
    }, { passive: true, signal });

    track.addEventListener('touchend', () => {
      if (Math.abs(touchDistanceX) > minSwipeDistance) {
        if (touchDistanceX < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }, { signal });

    /* ══════════════════════════════════════
       Resize Handler
       ══════════════════════════════════════ */
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateTransform(false);
      }, 60);
    };
    window.addEventListener('resize', onResize, { signal });

    /* ══════════════════════════════════════
       Initial Positioning
       ══════════════════════════════════════ */
    // rAF runs before the next paint, so positioning here avoids a forced sync layout after clone insertion.
    requestAnimationFrame(() => updateTransform(false));

    /* ══════════════════════════════════════
       Shopify Theme Editor Event Handling
       ══════════════════════════════════════ */
    function onBlockSelect(event) {
      if (event.detail && event.detail.sectionId === sectionIdAttr) {
        const blockEl = event.target;
        const blockIndex = originalSlides.indexOf(blockEl);
        if (blockIndex !== -1) {
          currentIndex = totalPrefixCount + blockIndex;
          updateTransform(true);
        }
      }
    }
    document.addEventListener('shopify:block:select', onBlockSelect, { signal });
  }

  function initAll(root) {
    (root || document).querySelectorAll('.nvgd-testimonial').forEach(initInstance);
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (event && event.target && event.target.querySelector) {
      const sectionEl = event.target.querySelector('.nvgd-testimonial');
      if (sectionEl) initInstance(sectionEl);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
})();
