/* Household Gallery — pill navigation / location switcher.
 * Moved verbatim from the inline <script> in sections/household-gallery.liquid;
 * per-instance -{section_id} selectors generalized to stable classes so the
 * deferred asset can initialize every instance (dataset-guarded). */
(function () {
  function initHouseholdGallery(container) {
    if (container.dataset.householdGalleryInit === 'true') return;
    container.dataset.householdGalleryInit = 'true';

    const pills = container.querySelectorAll('.pill-nav [data-location]');
    const locations = container.querySelectorAll('[data-location-content]');

    pills.forEach(function (pill) {
      pill.addEventListener('click', function (e) {
        e.preventDefault();
        const locationId = this.getAttribute('data-location');

        pills.forEach(function (p) {
          p.classList.remove('active-pill');
        });
        this.classList.add('active-pill');

        locations.forEach(function (location) {
          location.classList.remove('active-location');
        });

        const activeLocation = container.querySelector('[data-location-content="' + locationId + '"]');
        if (activeLocation) {
          activeLocation.classList.add('active-location');
        }
      });
    });
  }

  function initAll(root) {
    root.querySelectorAll('.household-gallery-container').forEach(initHouseholdGallery);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (event.target && event.target.querySelectorAll) {
      initAll(event.target);
    }
  });
})();
