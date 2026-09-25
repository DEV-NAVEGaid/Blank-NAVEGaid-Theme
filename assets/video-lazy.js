/**
 * video-lazy.js
 * Defers muted autoplay video data fetches until the video is at least 25% in
 * view. Autoplaying videos render with `data-video-lazy-autoplay`,
 * `preload="none"` and no `autoplay` attribute; this script plays them when
 * they enter the viewport. Merchant autoplay settings are unchanged — only the
 * start moment shifts to viewport entry.
 *
 * Multi-instance safe: a single shared IntersectionObserver; per-video
 * `data-video-lazy-init` guard prevents duplicate observation across
 * `shopify:section:load` re-renders.
 */
(function () {
  'use strict';

  var THRESHOLD = 0.25;
  var observer = null;

  function getObserver() {
    if (observer || !('IntersectionObserver' in window)) return observer;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var video = entry.target;
        observer.unobserve(video);
        video.dataset.videoLazyPlayed = 'true';
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay blocked; user can play via controls */ });
      });
    }, { threshold: THRESHOLD });
    return observer;
  }

  function init() {
    var videos = document.querySelectorAll('main video[data-video-lazy-autoplay]:not([data-video-lazy-init])');
    var io = getObserver();
    videos.forEach(function (video) {
      video.dataset.videoLazyInit = 'true';
      if (io) {
        io.observe(video);
      } else {
        video.dataset.videoLazyPlayed = 'true';
        video.play().catch(function () {});
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('shopify:section:load', init);
})();
