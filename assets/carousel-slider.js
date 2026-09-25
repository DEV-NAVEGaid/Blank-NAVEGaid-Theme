(function() {
  function init(section) {
    var imageTrack = section.querySelector('[data-track="image"]');
    var textTrack = section.querySelector('[data-track="text"]');
    if (!imageTrack) return;

    var slides = Array.from(imageTrack.children);
    var prevBtn = section.querySelector('.cr-prev');
    var nextBtn = section.querySelector('.cr-next');
    var dots = Array.from(section.querySelectorAll('.cr-dot'));
    var current = 0;
    var count = slides.length;

    function go(i) {
      current = i;
      var tx = '-' + (current * 100) + '%';
      /* Only move the two tracks — nothing else */
      imageTrack.style.transform = 'translateX(' + tx + ')';
      if (textTrack) textTrack.style.transform = 'translateX(' + tx + ')';
      dots.forEach(function(d, idx) { d.classList.toggle('active', idx === current); });
    }

    if (prevBtn) prevBtn.addEventListener('click', function() {
      go(current <= 0 ? count - 1 : current - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      go(current >= count - 1 ? 0 : current + 1);
    });
    dots.forEach(function(d, i) {
      d.addEventListener('click', function() { go(i); });
    });

    /* Touch / swipe on image track */
    var startX = 0, curX = 0, dragging = false;

    imageTrack.addEventListener('touchstart', function(e) {
      startX = e.changedTouches[0].screenX;
      curX = startX;
      dragging = true;
      imageTrack.style.transition = 'none';
      if (textTrack) textTrack.style.transition = 'none';
    }, { passive: true });

    imageTrack.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      curX = e.changedTouches[0].screenX;
      var diff = curX - startX;
      var pct = (diff / imageTrack.offsetWidth) * 100;
      var base = -current * 100;
      imageTrack.style.transform = 'translateX(' + (base + pct) + '%)';
      if (textTrack) textTrack.style.transform = 'translateX(' + (base + pct) + '%)';
    }, { passive: true });

    imageTrack.addEventListener('touchend', function() {
      if (!dragging) return;
      dragging = false;
      imageTrack.style.transition = 'transform 0.3s ease-out';
      if (textTrack) textTrack.style.transition = 'transform 0.3s ease-out';
      var diff = curX - startX;
      if (Math.abs(diff) > 50) {
        if (diff < 0 && current < count - 1) current++;
        else if (diff > 0 && current > 0) current--;
      }
      go(current);
      setTimeout(function() {
        imageTrack.style.transition = 'transform 0.5s ease-in-out';
        if (textTrack) textTrack.style.transition = 'transform 0.5s ease-in-out';
      }, 300);
    });

    go(0);
  }
  document.querySelectorAll('[data-carousel-id]').forEach(init);

  if (window.Shopify && window.Shopify.designMode) {
    var ac = new AbortController();
    document.addEventListener('shopify:section:load', function(e) {
      var el = e.target.querySelector('[data-carousel-id]');
      if (el) init(el);
    }, { signal: ac.signal });
    document.addEventListener('shopify:block:select', function(e) {
      var el = e.target.closest('[data-carousel-id]');
      if (el) init(el);
    }, { signal: ac.signal });
    document.addEventListener('shopify:section:unload', function(e) {
      if (e.target && e.target.querySelector && e.target.querySelector('[data-carousel-id]')) ac.abort();
    }, { signal: ac.signal });
  }
})();
