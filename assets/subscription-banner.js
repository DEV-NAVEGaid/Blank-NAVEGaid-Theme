/**
 * Subscription banner — scroll-to cards.
 * Moved verbatim from the inline <script> in sections/subscription-banner.liquid:
 * - per-instance `.subscription-banner-<id>__card` selectors generalized to the
 *   stable `subscription-banner` root class (added alongside the legacy class),
 * - the Liquid `{{ section.settings.scroll_offset }}` value is rendered as
 *   data-scroll-offset on the section root and read at event time,
 * - per-root dataset guard makes multi-instance re-init idempotent.
 */
(function () {
  function nvgdSubBannerInit(root) {
    if (!root || root.dataset.subBannerInit === 'true') return;
    root.dataset.subBannerInit = 'true';

    const cards = root.querySelectorAll('.subscription-banner__card[data-scroll-to]');

    cards.forEach((card) => {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = card.getAttribute('data-scroll-to');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          const offset = parseInt(root.dataset.scrollOffset, 10) || 0;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function nvgdSubBannerInitAll() {
    document.querySelectorAll('.subscription-banner').forEach(nvgdSubBannerInit);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', nvgdSubBannerInitAll); else nvgdSubBannerInitAll();
  document.addEventListener('shopify:section:load', function (e) {
    const root = e.target && e.target.querySelector ? e.target.querySelector('.subscription-banner') : null;
    if (root) nvgdSubBannerInit(root);
  });
})();
