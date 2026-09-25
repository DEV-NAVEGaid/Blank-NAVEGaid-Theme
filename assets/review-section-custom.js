(function() {
  function initReviewSection(root, force) {
    if (!root) return;
    if (!force && root.dataset.nvgdReviewInit) return;
    root.dataset.nvgdReviewInit = 'true';

    // Tab switching functionality
    const tabs = root.querySelectorAll('.nvgd-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('nvgd-tab--active'));
        tab.classList.add('nvgd-tab--active');
      });
    });

    // Sort button toggle
    const sortBtn = root.querySelector('.nvgd-sort-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        sortBtn.classList.toggle('nvgd-sort-btn--open');
      });
    }

    // Show More functionality
    root.querySelectorAll('.nvgd-show-more').forEach(btn => {
      btn.addEventListener('click', function() {
        const wrapper = this.parentElement;
        const textEl = wrapper.querySelector('.nvgd-review-text');

        if (textEl.classList.contains('nvgd-review-text--truncated')) {
          textEl.classList.remove('nvgd-review-text--truncated');
          textEl.classList.add('nvgd-review-text--expanded');
          this.textContent = btn.dataset.showLess;
        } else {
          textEl.classList.remove('nvgd-review-text--expanded');
          textEl.classList.add('nvgd-review-text--truncated');
          this.textContent = btn.dataset.showMore;
        }
      });
    });
  }

  function initAll() {
    document.querySelectorAll('.nvgd-container-outer').forEach(function(root) {
      initReviewSection(root, false);
    });
  }

  function nvgdReviewInit(e) {
    if (e && e.detail && e.detail.sectionId) {
      // shopify:section:load — re-init only the section that reloaded
      const sec = document.getElementById('shopify-section-' + e.detail.sectionId);
      if (sec) sec.querySelectorAll('.nvgd-container-outer').forEach(function(root) {
        initReviewSection(root, true);
      });
      return;
    }
    initAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nvgdReviewInit); else nvgdReviewInit();
  document.addEventListener('shopify:section:load', nvgdReviewInit);
})();
