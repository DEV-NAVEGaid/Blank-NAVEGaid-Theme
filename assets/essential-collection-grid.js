(function() {
  function initSliderDrag() {
    document.querySelectorAll('.ecg-grid.is-slider').forEach(function(slider) {
      if (slider.dataset.dragInit) return;
      slider.dataset.dragInit = 'true';

      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;

      slider.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        isDown = true;
        moved = false;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      window.addEventListener('mouseup', function() {
        isDown = false;
      });

      slider.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 4) moved = true;
        slider.scrollLeft = scrollLeft - walk;
      });

      slider.addEventListener('click', function(e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSliderDrag);
  } else {
    initSliderDrag();
  }
  document.addEventListener('shopify:section:load', initSliderDrag);
})();
