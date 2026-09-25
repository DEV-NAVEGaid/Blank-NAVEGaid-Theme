/* moved from inline <script> in sections/features-carousel.liquid (deferred asset) */
function initFeaturesCarousel(container) {
  if (container.dataset.featuresCarouselInit) return;
  container.dataset.featuresCarouselInit = 'true';

  const track = container.querySelector('.features-carousel__track');
  if (!track) return;
  const controller = new AbortController();
  let parallaxFrame = null;

  // --- SMOOTH DRAG TO SCROLL ---
  let isDown = false;
  let isDragging = false;
  let startX;
  let scrollLeft;
  let velX = 0;
  let momentumID;

  const beginDragging = (e) => {
    isDown = true;
    isDragging = false;
    track.classList.add('is-dragging');
    startX = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    cancelMomentumTracking();
  };

  const stopDragging = () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('is-dragging');

    if (Math.abs(velX) > 0.5) {
      beginMomentumTracking();
    }
  };

  const drag = (e) => {
    if (!isDown) return;
    e.preventDefault();
    isDragging = true;

    const x = (e.pageX || e.touches[0].pageX) - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    const prevScrollLeft = track.scrollLeft;
    track.scrollLeft = scrollLeft - walk;
    velX = track.scrollLeft - prevScrollLeft;
  };

  const beginMomentumTracking = () => {
    cancelMomentumTracking();
    momentumID = requestAnimationFrame(momentumLoop);
  };

  const cancelMomentumTracking = () => {
    cancelAnimationFrame(momentumID);
  };

  const momentumLoop = () => {
    track.scrollLeft += velX;
    velX *= 0.95;
    if (Math.abs(velX) > 0.5) {
      momentumID = requestAnimationFrame(momentumLoop);
    }
  };

   // Mouse events only (touch devices use native scroll-snap)
  track.addEventListener('mousedown', beginDragging, { signal: controller.signal });
  track.addEventListener('mouseleave', stopDragging, { signal: controller.signal });
  track.addEventListener('mouseup', stopDragging, { signal: controller.signal });
  track.addEventListener('mousemove', drag, { signal: controller.signal });

  // Prevent click events after mouse-dragging
  track.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true, signal: controller.signal });

  // --- PARALLAX EFFECT ---
  const isParallaxEnabled = container.getAttribute('data-parallax') === 'true';
  const rawSpeed = parseInt(container.getAttribute('data-parallax-speed')) || 30;
  const parallaxFactor = rawSpeed / 400;

  if (isParallaxEnabled) {
    let ticking = false;

    const updateParallax = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const centerOffset = (windowHeight / 2) - (rect.top + rect.height / 2);
        const yPos = centerOffset * parallaxFactor;
        track.style.transform = `translateY(${yPos}px)`;
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        parallaxFrame = window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true, signal: controller.signal });

    updateParallax();
  }
  document.addEventListener('shopify:section:unload', (event) => {
    const unloadedSectionId = event.detail && event.detail.sectionId;
    const eventTarget = event.target;
    const ownsSection = unloadedSectionId === container.dataset.sectionId ||
      (!unloadedSectionId && eventTarget && typeof eventTarget.contains === 'function' &&
        eventTarget.contains(container));
    if (!ownsSection) return;
    cancelMomentumTracking();
    if (parallaxFrame !== null) cancelAnimationFrame(parallaxFrame);
    controller.abort();
  }, { signal: controller.signal });
}

function initAllFeaturesCarousels(root) {
  (root || document).querySelectorAll('.features-carousel').forEach(initFeaturesCarousel);
}

initAllFeaturesCarousels();
document.addEventListener('shopify:section:load', function (event) {
  initAllFeaturesCarousels(event.target);
});
