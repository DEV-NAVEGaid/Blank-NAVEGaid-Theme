/* Icon SVGs rendered once via Liquid <template> elements in video-carousel-popup snippet */
var __nvgdIconHighInit = document.getElementById('nvgdIconVolumeHigh');
var __nvgdIconXmarkInit = document.getElementById('nvgdIconVolumeXmark');
window.__nvgdIconHigh = __nvgdIconHighInit ? __nvgdIconHighInit.innerHTML : '';
window.__nvgdIconXmark = __nvgdIconXmarkInit ? __nvgdIconXmarkInit.innerHTML : '';

// Global Video Popup Controller
if (!window.NVGDVideoPopup) {
window.NVGDVideoPopup = (function() {
  let currentVideoIndex = 0;
  let isMuted = false;
  let videos = [];
  let shopButtonConfig = { text: 'Shop', url: '' };

  // Get elements
  const popupOverlay = document.getElementById('nvgdPopupOverlay');
  const popupContainer = document.getElementById('nvgdPopupContainer');
  const popupClose = document.getElementById('nvgdPopupClose');
  const videoPlayer = document.getElementById('nvgdVideoPlayer');
  const videoTitle = document.getElementById('nvgdVideoTitle');
  const prevBtn = document.getElementById('nvgdPrevBtn');
  const nextBtn = document.getElementById('nvgdNextBtn');
  const shareBtn = document.getElementById('nvgdPopupShare');
  const shopBtn = document.getElementById('nvgdShopBtn');
  const soundToggle = document.getElementById('nvgdSoundToggle');
  const menuBtn = document.getElementById('nvgdPopupMenu');
  const progressFill = document.getElementById('nvgdProgressFill');

  // Initialize function (called from video slider blocks)
  function init(videoData, shopConfig) {
    videos = videoData || [];
    shopButtonConfig = shopConfig || { text: 'Shop', url: '' };

    // Show/hide shop button based on config
    if (shopButtonConfig.text && shopBtn) {
      shopBtn.textContent = shopButtonConfig.text;
      shopBtn.style.display = 'block';
    }
  }

  // Open popup function
  function open(index) {
    if (videos.length === 0) return;

    currentVideoIndex = index;
    updateVideoContent();
    popupOverlay.classList.add('nvgd-active');
    popupContainer.classList.add('nvgd-active');
  }

  // Close popup function
  function close() {
    popupOverlay.classList.remove('nvgd-active');
    popupContainer.classList.remove('nvgd-active');
    if (videoPlayer) videoPlayer.pause();
    if (progressFill) progressFill.style.width = '0%';
    closeReportMenu();
    closeShareSheet();
  }

  // Update video content
  function updateVideoContent() {
    if (videos[currentVideoIndex]) {
      const video = videos[currentVideoIndex];
      if (videoTitle) videoTitle.textContent = video.title;

      // Reset progress bar
      if (progressFill) progressFill.style.width = '0%';

      if (videoPlayer) {
        videoPlayer.src = video.videoUrl;
        videoPlayer.muted = isMuted;
        videoPlayer.load();

        // Try to play unmuted; if browser blocks it, fall back to muted
        const playPromise = videoPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            isMuted = true;
            videoPlayer.muted = true;
            if (soundToggle) soundToggle.innerHTML = window.__nvgdIconXmark;
            videoPlayer.play();
          });
        }
      }
    }
  }

  // Navigate to previous video
  function showPrev() {
    currentVideoIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
    updateVideoContent();
  }

  // Navigate to next video
  function showNext() {
    currentVideoIndex = (currentVideoIndex + 1) % videos.length;
    updateVideoContent();
  }

  // Toggle sound
  function toggleSound() {
    isMuted = !isMuted;
    if (videoPlayer) videoPlayer.muted = isMuted;
    if (soundToggle) soundToggle.innerHTML = isMuted ? window.__nvgdIconXmark : window.__nvgdIconHigh;
  }

  // Event Listeners
  if (popupClose) {
    popupClose.addEventListener('click', close);
  }

  if (popupOverlay) {
    popupOverlay.addEventListener('click', close);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', showPrev);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', showNext);
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', toggleSound);
  }

  // Report elements — Step 1: Bottom sheet
  const reportSheet = document.getElementById('nvgdReportSheet');
  const reportSheetClose = document.getElementById('nvgdReportSheetClose');
  const reportSheetBtn = document.getElementById('nvgdReportSheetBtn');
  const reportOverlay = document.getElementById('nvgdReportOverlay');

  // Report elements — Step 2: Full form
  const reportMenu = document.getElementById('nvgdReportMenu');
  const reportMenuClose = document.getElementById('nvgdReportMenuClose');
  const reportBody = document.getElementById('nvgdReportBody');
  const reportSuccess = document.getElementById('nvgdReportSuccess');
  const reportFooter = document.getElementById('nvgdReportFooter');
  const reportSubmit = document.getElementById('nvgdReportSubmit');
  const reportCancel = document.getElementById('nvgdReportCancel');
  const reportRadios = document.querySelectorAll('input[name="nvgd-report-reason"]');

  // Step 1: Open bottom sheet
  function openReportSheet() {
    if (reportSheet) reportSheet.classList.add('nvgd-active');
    if (reportOverlay) reportOverlay.classList.add('nvgd-active');
  }

  // Close bottom sheet
  function closeReportSheet() {
    if (reportSheet) reportSheet.classList.remove('nvgd-active');
    if (reportOverlay) reportOverlay.classList.remove('nvgd-active');
  }

  // Step 2: Open full report form
  function openReportForm() {
    closeReportSheet();
    // Reset form state
    if (reportBody) reportBody.style.display = '';
    if (reportSuccess) reportSuccess.classList.remove('nvgd-active');
    if (reportFooter) reportFooter.style.display = '';
    if (reportSubmit) reportSubmit.disabled = true;
    reportRadios.forEach(r => r.checked = false);

    if (reportMenu) reportMenu.classList.add('nvgd-active');
  }

  // Close full report form
  function closeReportMenu() {
    if (reportMenu) reportMenu.classList.remove('nvgd-active');
    if (reportSheet) reportSheet.classList.remove('nvgd-active');
    if (reportOverlay) reportOverlay.classList.remove('nvgd-active');
  }

  // Enable submit when a reason is selected
  reportRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (reportSubmit) reportSubmit.disabled = false;
    });
  });

  // ⋮ button → open bottom sheet
  if (menuBtn) {
    menuBtn.addEventListener('click', openReportSheet);
  }

  // Bottom sheet close
  if (reportSheetClose) {
    reportSheetClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeReportSheet();
    });
  }

  // Bottom sheet overlay close
  if (reportOverlay) {
    reportOverlay.addEventListener('click', () => {
      closeReportSheet();
      closeReportMenu();
      closeShareSheet();
    });
  }

  // "Report" button in bottom sheet → open full form
  if (reportSheetBtn) {
    reportSheetBtn.addEventListener('click', openReportForm);
  }

  // Full form close (✕)
  if (reportMenuClose) {
    reportMenuClose.addEventListener('click', closeReportMenu);
  }

  // Cancel button
  if (reportCancel) {
    reportCancel.addEventListener('click', closeReportMenu);
  }

  // Submit report
  if (reportSubmit) {
    reportSubmit.addEventListener('click', () => {
      const selected = document.querySelector('input[name="nvgd-report-reason"]:checked');
      if (!selected) return;

      const reason = selected.value;
      const vidUrl = videos[currentVideoIndex] ? videos[currentVideoIndex].videoUrl : '';
      const vidTitle = videos[currentVideoIndex] ? videos[currentVideoIndex].title : '';

      // Submit via Shopify contact form
      fetch('/contact#contact_form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form_type': 'contact',
          'utf8': '✓',
          'contact[email]': 'video-report@noreply.com',
          'contact[body]': `Video Report\n\nReason: ${reason}\nVideo: ${vidTitle}\nURL: ${vidUrl}\nPage: ${window.location.href}\nTime: ${new Date().toISOString()}`
        })
      }).catch(() => {});

      // Show success state
      if (reportBody) reportBody.style.display = 'none';
      if (reportFooter) reportFooter.style.display = 'none';
      if (reportSuccess) reportSuccess.classList.add('nvgd-active');

      setTimeout(closeReportMenu, 2000);
    });
  }

  // Share bottom sheet
  const shareSheet = document.getElementById('nvgdShareSheet');
  const shareSheetClose = document.getElementById('nvgdShareSheetClose');
  const shareFacebook = document.getElementById('nvgdShareFacebook');
  const shareLinkedin = document.getElementById('nvgdShareLinkedin');
  const shareWhatsapp = document.getElementById('nvgdShareWhatsapp');
  const shareTwitter = document.getElementById('nvgdShareTwitter');
  const shareCopy = document.getElementById('nvgdShareCopy');

  function getShareUrl() {
    return window.location.href;
  }

  function getShareText() {
    return videos[currentVideoIndex] ? videos[currentVideoIndex].title : '';
  }

  function openShareSheet() {
    // Reset copy button
    if (shareCopy) {
      shareCopy.classList.remove('nvgd-copied');
      shareCopy.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg> Copy link';
    }
    if (shareSheet) shareSheet.classList.add('nvgd-active');
    if (reportOverlay) reportOverlay.classList.add('nvgd-active');
  }

  function closeShareSheet() {
    if (shareSheet) shareSheet.classList.remove('nvgd-active');
    if (reportOverlay) reportOverlay.classList.remove('nvgd-active');
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', openShareSheet);
  }

  if (shareSheetClose) {
    shareSheetClose.addEventListener('click', closeShareSheet);
  }

  if (shareFacebook) {
    shareFacebook.addEventListener('click', () => {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(getShareUrl()), '_blank', 'width=600,height=400');
    });
  }

  if (shareLinkedin) {
    shareLinkedin.addEventListener('click', () => {
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(getShareUrl()), '_blank', 'width=600,height=400');
    });
  }

  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', () => {
      window.open('https://wa.me/?text=' + encodeURIComponent(getShareText() + ' ' + getShareUrl()), '_blank');
    });
  }

  if (shareTwitter) {
    shareTwitter.addEventListener('click', () => {
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText()) + '&url=' + encodeURIComponent(getShareUrl()), '_blank', 'width=600,height=400');
    });
  }

  if (shareCopy) {
    shareCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(getShareUrl()).then(() => {
        shareCopy.classList.add('nvgd-copied');
        shareCopy.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Copied!';
        setTimeout(() => {
          shareCopy.classList.remove('nvgd-copied');
          shareCopy.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg> Copy link';
        }, 2000);
      });
    });
  }

  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      if (shopButtonConfig.url) {
        window.location.href = shopButtonConfig.url;
      } else {
        // Scroll to add to cart or product form
        const productForm = document.querySelector('form[action*="/cart/add"]');
        if (productForm) {
          close();
          productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }

  // Click anywhere in popup to play/pause (ignore buttons/controls)
  if (popupContainer && videoPlayer) {
    popupContainer.addEventListener('click', (e) => {
      if (e.target.closest('button, a, .nvgd-nav-vertical')) return;
      if (e.target.closest('.nvgd-video-container') || e.target.closest('.nvgd-popup-content')) {
        if (videoPlayer.paused) {
          videoPlayer.play();
        } else {
          videoPlayer.pause();
        }
      }
    });

    // Loop video when ended
    videoPlayer.addEventListener('ended', () => {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    });

    // Progress bar update via animation frame loop
    let progressRAF = null;
    function updateProgress() {
      if (progressFill && videoPlayer.duration && isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressFill.style.width = pct + '%';
      }
      if (popupContainer.classList.contains('nvgd-active')) {
        progressRAF = requestAnimationFrame(updateProgress);
      }
    }

    // Start/stop the progress loop with play/pause
    videoPlayer.addEventListener('play', () => {
      if (progressRAF) cancelAnimationFrame(progressRAF);
      progressRAF = requestAnimationFrame(updateProgress);
    });
    videoPlayer.addEventListener('pause', () => {
      if (progressRAF) cancelAnimationFrame(progressRAF);
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!popupContainer.classList.contains('nvgd-active')) return;

    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      showPrev();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      showNext();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (videoPlayer.paused) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    }
  });

  // Prevent scroll on popup container only
  if (popupContainer) {
    popupContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  // Swipe gestures for mobile
  let touchStartY = 0;
  let touchEndY = 0;

  if (popupContainer) {
    popupContainer.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    popupContainer.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartY - touchEndY > swipeThreshold) {
      showNext();
    } else if (touchEndY - touchStartY > swipeThreshold) {
      showPrev();
    }
  }

  // Public API
  return {
    init: init,
    open: open,
    close: close
  };
})();
} // end guard against double-init
