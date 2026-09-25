// Moved from inline <script> in snippets/video-carousel.liquid.
// Per-video data is rendered by Liquid into data-* attributes on the
// wrapper / slide elements; this script reads them at init time.

function getYouTubeId(url) {
  var match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function initCarousel(wrapper) {
  if (wrapper.dataset.nvgdVideoCarouselInit) return;
  wrapper.dataset.nvgdVideoCarouselInit = 'true';

  var sectionId = (wrapper.className.match(/nvgd-video-slider-wrapper-(\S+)/) || [])[1] || '';
  var contentSelector = '.nvgd-video-slider-content-' + sectionId;

  // Video data from Liquid-rendered data-* attributes
  var videos = [];
  var items = wrapper.querySelectorAll(contentSelector);

  items.forEach(function(item) {
    videos.push({
      title: item.getAttribute('data-video-title') || 'Video',
      description: item.getAttribute('data-video-description') || '',
      videoUrl: item.getAttribute('data-video-url') || ''
    });
  });

  // Shop button configuration
  var shopConfig = {
    text: wrapper.getAttribute('data-shop-button-text') || 'Shop',
    url: wrapper.getAttribute('data-shop-button-url') || ''
  };

  // Exit if no videos
  if (videos.length === 0) return;

  /**
   * Auto-thumbnail: resolve a thumbnail URL from a video URL.
   * Supports YouTube and direct video files.
   */
  function autoThumbnails() {
    items.forEach(function(item) {
      var autoThumb = item.querySelector('.nvgd-auto-thumb');
      if (!autoThumb) return; // has a manual thumbnail, skip

      var videoUrl = item.getAttribute('data-video-url') || '';

      // YouTube
      var ytId = getYouTubeId(videoUrl);
      if (ytId) {
        autoThumb.src = 'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg';
        return;
      }

      // Direct video file — generate thumbnail from first frame
      var videoExts = /\.(mp4|webm|ogg|mov)(\?|$)/i;
      if (videoExts.test(videoUrl)) {
        var tempVideo = document.createElement('video');
        tempVideo.crossOrigin = 'anonymous';
        tempVideo.muted = true;
        tempVideo.preload = 'metadata';
        tempVideo.playsInline = true;

        tempVideo.addEventListener('loadeddata', function() {
          // Seek slightly in to avoid a black first frame
          tempVideo.currentTime = Math.min(1, tempVideo.duration * 0.1);
        });

        tempVideo.addEventListener('seeked', function() {
          try {
            var canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            var ctx = canvas.getContext('2d');

            // Cover-crop: fill the square from center
            var vw = tempVideo.videoWidth;
            var vh = tempVideo.videoHeight;
            var size = Math.min(vw, vh);
            var sx = (vw - size) / 2;
            var sy = (vh - size) / 2;

            ctx.drawImage(tempVideo, sx, sy, size, size, 0, 0, 400, 400);
            autoThumb.src = canvas.toDataURL('image/jpeg', 0.8);
          } catch (e) {
            // CORS or other error — keep placeholder
          }
          // Clean up
          tempVideo.src = '';
          tempVideo.load();
        });

        tempVideo.src = videoUrl;
        return;
      }
    });
  }

  // Wait for popup to be available
  function initPopup() {
    if (window.NVGDVideoPopup) {
      window.NVGDVideoPopup.init(videos, shopConfig);

      items.forEach(function(content, index) {
        content.addEventListener('click', function() {
          window.NVGDVideoPopup.open(index);
        });
      });
    } else {
      setTimeout(initPopup, 100);
    }
  }

  autoThumbnails();
  initPopup();
}

function initAll() {
  document.querySelectorAll('.nvgd-video-slider-wrapper').forEach(initCarousel);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
