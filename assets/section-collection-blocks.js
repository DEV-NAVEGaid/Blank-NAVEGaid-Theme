/* moved from sections/collection-blocks.liquid inline <script> for bundling */
(function () {
  function initSection(root) {
    if (!root || root.dataset.cbInit) return;
    root.dataset.cbInit = 'true';
    var faqBehavior = root.dataset.faqBehavior;

    // ==========================================
    // FAQ ACCORDION FUNCTIONALITY
    // ==========================================
    var faqToggles = root.querySelectorAll('.cb-faq-toggle');

    faqToggles.forEach(function (button) {
      button.addEventListener('click', function () {
        var row = this.closest('.cb-faq-row');
        var content = row.querySelector('.cb-faq-content');
        var isExpanded = this.getAttribute('aria-expanded') === 'true';

        if (faqBehavior === 'single') {
          // Close all other FAQ rows
          faqToggles.forEach(function (otherButton) {
            if (otherButton !== button) {
              var otherRow = otherButton.closest('.cb-faq-row');
              var otherContent = otherRow.querySelector('.cb-faq-content');
              otherButton.setAttribute('aria-expanded', 'false');
              otherRow.classList.remove('active');
              if (otherContent) otherContent.style.maxHeight = null;
            }
          });
        }

        // Toggle current row
        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          row.classList.remove('active');
          content.style.maxHeight = null;
        } else {
          this.setAttribute('aria-expanded', 'true');
          row.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('.cb-section').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (e) {
    initAll(e.target);
  });
})();
