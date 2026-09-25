(function() {
  function initUpsellSlider(section) {
    if (section.dataset.upsellInitialized === 'true') return;

    const slider = section.querySelector('.upsell-slider');
    if (!slider) return;

    const sliderWrapper = section.querySelector('.upsell-slider-wrapper');
    const prevButton = section.querySelector('.upsell-arrow--prev');
    const nextButton = section.querySelector('.upsell-arrow--next');
    const slides = Array.from(slider.querySelectorAll('.upsell-product-card'));

    if (slides.length === 0) return;
    section.dataset.upsellInitialized = 'true';

    const abortController = new AbortController();
    const { signal } = abortController;
    let resizeTimer;

    document.addEventListener('shopify:section:unload', function(event) {
      if (event.target.querySelector('.upsell-section') === section) {
        abortController.abort();
        clearTimeout(resizeTimer);
      }
    }, { signal });

    let currentIndex = 0;
    let slidesPerView = 3;
    let isMobile = false;

    function updateSlidesPerView() {
      const width = window.innerWidth;
      isMobile = width <= 768;

      if (width <= 640) {
        slidesPerView = 1;
      } else if (width <= 1024) {
        slidesPerView = 2;
      } else {
        slidesPerView = 3;
      }
    }

    function updateSlider() {
      updateSlidesPerView();

      // On mobile, use native scroll instead of transform
      if (isMobile && sliderWrapper) {
        slider.style.transform = '';
        return;
      }

      const slideWidth = slides[0].offsetWidth;
      const gap = 24;
      const offset = (slideWidth + gap) * currentIndex;

      slider.style.transform = `translateX(-${offset}px)`;
    }

    function nextSlide() {
      if (isMobile) return; // Disable on mobile

      updateSlidesPerView();
      const maxIndex = Math.max(0, slides.length - slidesPerView);
      currentIndex = (currentIndex + 1) % (slides.length);

      // Loop back to start
      if (currentIndex > maxIndex) {
        currentIndex = 0;
      }

      updateSlider();
    }

    function prevSlide() {
      if (isMobile) return; // Disable on mobile

      updateSlidesPerView();
      currentIndex = currentIndex - 1;

      // Loop to end
      if (currentIndex < 0) {
        currentIndex = Math.max(0, slides.length - slidesPerView);
      }

      updateSlider();
    }

    if (prevButton) {
      prevButton.addEventListener('click', prevSlide);
    }

    if (nextButton) {
      nextButton.addEventListener('click', nextSlide);
    }

    // Update on resize
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateSlider();
      }, 150);
    }, { signal });

    // Initialize
    updateSlider();
  }

  // Initialize all upsell sections
  const sections = document.querySelectorAll('.upsell-section');
  sections.forEach(section => initUpsellSlider(section));

  // Re-initialize when Shopify theme editor makes changes
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', function(event) {
      const section = event.target.querySelector('.upsell-section');
      if (section) {
        initUpsellSlider(section);
      }
    });
  }
})();
