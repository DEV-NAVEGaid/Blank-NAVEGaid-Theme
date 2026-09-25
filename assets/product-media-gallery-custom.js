document.addEventListener('DOMContentLoaded', function() {
  const galleryTeardown = new AbortController();
  document.addEventListener('shopify:section:unload', function () {
    galleryTeardown.abort();
  }, { once: true });

  const thumbnails = document.querySelectorAll('.nvgd-thumbnail-item');
  const mainImages = document.querySelectorAll('.nvgd-media-image');
  const zoomModal = document.getElementById('nvgdZoomModal');
  const zoomSlider = document.getElementById('nvgdZoomSlider');
  const zoomSlides = document.querySelectorAll('.nvgd-zoom-slide');
  const zoomClose = document.querySelector('.nvgd-zoom-close');
  const zoomPrev = document.querySelector('.nvgd-zoom-prev');
  const zoomNext = document.querySelector('.nvgd-zoom-next');
  const zoomCurrent = document.getElementById('nvgdZoomCurrent');
  const zoomTotal = document.getElementById('nvgdZoomTotal');
  const mainGalleryContainer = document.querySelector('.nvgd-main-gallery-container');

  let currentZoomIndex = 0;
  const totalImages = mainImages.length;

  // Swipe state — all in pixels now
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let dragDistance = 0;

  // ===== MOBILE DOTS =====
  if (window.innerWidth <= 768) {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'nvgd-slider-dots';

    mainImages.forEach(function(_, index) {
      const dot = document.createElement('span');
      dot.className = 'nvgd-slider-dot';
      if (index === 0) dot.classList.add('active');
      dotsContainer.appendChild(dot);
    });

    mainGalleryContainer.appendChild(dotsContainer);

    mainGalleryContainer.addEventListener('scroll', function() {
      var scrollLeft = this.scrollLeft;
      var itemWidth = mainImages[0].offsetWidth;
      var currentIndex = Math.round(scrollLeft / itemWidth);

      document.querySelectorAll('.nvgd-slider-dot').forEach(function(dot, index) {
        dot.classList.toggle('active', index === currentIndex);
      });
    });
  }

  // ===== THUMBNAIL CLICK (DESKTOP) =====
  thumbnails.forEach(function(thumbnail, index) {
    thumbnail.addEventListener('click', function() {
      thumbnails.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');

      var targetImage = mainImages[index];
      if (targetImage) {
        targetImage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // ===== ACTIVE THUMBNAIL ON SCROLL (DESKTOP) =====
  if (window.innerWidth > 768) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var index = entry.target.dataset.mediaIndex;
          thumbnails.forEach(function(t) { t.classList.remove('active'); });
          if (thumbnails[index]) thumbnails[index].classList.add('active');
        }
      });
    }, { root: null, rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    mainImages.forEach(function(image) { observer.observe(image); });
  }

  // ===== ZOOM MODAL CORE =====

  function getSlideWidth() {
    return window.innerWidth;
  }

  function resetAllZoomedImages() {
    zoomSlides.forEach(function(slide) {
      slide.querySelector('img').classList.remove('is-zoomed');
    });
  }

  function snapToSlide(animate) {
    if (animate) {
      zoomSlider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      zoomSlider.style.transition = 'none';
    }
    var offset = currentZoomIndex * -getSlideWidth();
    zoomSlider.style.transform = 'translateX(' + offset + 'px)';
    prevTranslate = offset;
    currentTranslate = offset;
    zoomCurrent.textContent = currentZoomIndex + 1;
  }

  function openZoom(index) {
    currentZoomIndex = index;
    resetAllZoomedImages();
    zoomModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    snapToSlide(false);
  }

  function closeZoom() {
    zoomModal.classList.remove('active');
    document.body.style.overflow = '';
    resetAllZoomedImages();
  }

  function showPrevImage() {
    if (currentZoomIndex > 0) {
      resetAllZoomedImages();
      currentZoomIndex--;
      snapToSlide(true);
    }
  }

  function showNextImage() {
    if (currentZoomIndex < totalImages - 1) {
      resetAllZoomedImages();
      currentZoomIndex++;
      snapToSlide(true);
    }
  }

  // Open zoom from main gallery
  mainImages.forEach(function(imageWrapper, index) {
    imageWrapper.addEventListener('click', function() {
      openZoom(index);
    });
  });

  // Nav buttons (stop propagation so they don't trigger slide click)
  zoomClose.addEventListener('click', function(e) { e.stopPropagation(); closeZoom(); });
  zoomPrev.addEventListener('click', function(e) { e.stopPropagation(); showPrevImage(); });
  zoomNext.addEventListener('click', function(e) { e.stopPropagation(); showNextImage(); });

  // Click overlay to close
  document.querySelector('.nvgd-zoom-overlay').addEventListener('click', closeZoom);

  // Keyboard
  document.addEventListener('keydown', function(e) {
    if (!zoomModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeZoom();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  }, { signal: galleryTeardown.signal });

  // ===== CLICK BEHAVIOR INSIDE ZOOM =====
  // Click on image → toggle slight zoom
  // Click on slide background (outside image) → close modal

  zoomSlides.forEach(function(slide) {
    var img = slide.querySelector('img');

    // Click on the empty area of the slide (not the image) → close
    slide.addEventListener('click', function(e) {
      if (e.target === slide) {
        closeZoom();
      }
    });

    // Click on image → toggle zoom (only if not a drag)
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      if (dragDistance < 5) {
        this.classList.toggle('is-zoomed');
      }
    });
  });

  // ===== SWIPE / DRAG (CONSISTENT PX UNITS) =====

  function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
  }

  function onDragStart(event) {
    // Block swiping while image is zoomed
    var currentImg = zoomSlides[currentZoomIndex] && zoomSlides[currentZoomIndex].querySelector('img');
    if (currentImg && currentImg.classList.contains('is-zoomed')) return;

    isDragging = true;
    startX = getPositionX(event);
    dragDistance = 0;
    zoomSlider.style.transition = 'none';
  }

  function onDragMove(event) {
    if (!isDragging) return;
    var currentX = getPositionX(event);
    var diff = currentX - startX;
    dragDistance = Math.abs(diff);
    currentTranslate = prevTranslate + diff;
    zoomSlider.style.transform = 'translateX(' + currentTranslate + 'px)';
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    var movedBy = currentTranslate - prevTranslate;

    if (movedBy < -100 && currentZoomIndex < totalImages - 1) {
      currentZoomIndex++;
    } else if (movedBy > 100 && currentZoomIndex > 0) {
      currentZoomIndex--;
    }

    snapToSlide(true);
  }

  // Touch
  zoomSlider.addEventListener('touchstart', onDragStart, { passive: true });
  zoomSlider.addEventListener('touchmove', onDragMove, { passive: true });
  zoomSlider.addEventListener('touchend', onDragEnd);

  // Mouse
  zoomSlider.addEventListener('mousedown', onDragStart);
  zoomSlider.addEventListener('mousemove', onDragMove);
  zoomSlider.addEventListener('mouseup', onDragEnd);
  zoomSlider.addEventListener('mouseleave', function() {
    if (isDragging) onDragEnd();
  });

  // Prevent native image drag
  zoomSlides.forEach(function(slide) {
    slide.querySelector('img').addEventListener('dragstart', function(e) { e.preventDefault(); });
  });

  // Prevent context menu on long press
  zoomSlider.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Recalculate position on resize so slides stay aligned
  window.addEventListener('resize', function() {
    if (zoomModal.classList.contains('active')) {
      snapToSlide(false);
    }
  }, { signal: galleryTeardown.signal });
});
document.addEventListener('DOMContentLoaded', function() {
  var stickyTeardown = new AbortController();
  document.addEventListener('shopify:section:unload', function () {
    stickyTeardown.abort();
  }, { once: true });

  var thumbnailWrapper = document.querySelector('.nvgd-thumbnail-sticky-wrapper');
  var thumbnailContainer = document.querySelector('.nvgd-media-thumbnail');
  var galleryWrapper = document.querySelector('.nvgd-custom-media-gallery-wrapper');

  if (!thumbnailWrapper || !thumbnailContainer || !galleryWrapper || window.innerWidth <= 768) return;

  var offsetTop = 20;

  function handleScroll() {
    var containerRect = thumbnailContainer.getBoundingClientRect();
    var galleryRect = galleryWrapper.getBoundingClientRect();
    var wrapperHeight = thumbnailWrapper.offsetHeight;

    thumbnailWrapper.classList.remove('is-sticky', 'is-bottom');
    thumbnailWrapper.style.left = '';

    if (containerRect.top <= offsetTop && galleryRect.bottom > wrapperHeight + offsetTop) {
      thumbnailWrapper.classList.add('is-sticky');
      thumbnailWrapper.style.left = containerRect.left + 'px';
    } else if (galleryRect.bottom <= wrapperHeight + offsetTop) {
      thumbnailWrapper.classList.add('is-bottom');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true, signal: stickyTeardown.signal });
  window.addEventListener('resize', handleScroll, { passive: true, signal: stickyTeardown.signal });
  handleScroll();
});
