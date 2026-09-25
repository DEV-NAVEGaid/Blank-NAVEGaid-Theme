/* Footer accordion setup, scoped per section instance. */
(() => {
  const controllers = new WeakMap();
  const mobileQuery = window.matchMedia('(max-width: 749px)');

  function syncAccordionState(footer) {
    footer.querySelectorAll('.nvgd-menu-accordion').forEach((accordion) => {
      const trigger = accordion.querySelector('.nvgd-accordion-trigger');
      if (!trigger) return;

      if (!mobileQuery.matches) accordion.classList.remove('active');
      trigger.setAttribute('aria-expanded', mobileQuery.matches ? String(accordion.classList.contains('active')) : 'true');
    });
  }

  function initFooter(footer) {
    controllers.get(footer)?.abort();
    const controller = new AbortController();

    footer.querySelectorAll('.nvgd-accordion-trigger').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        if (!mobileQuery.matches) return;
        const accordion = trigger.closest('.nvgd-menu-accordion');
        const expanded = accordion.classList.toggle('active');
        trigger.setAttribute('aria-expanded', String(expanded));
      }, { signal: controller.signal });
    });

    mobileQuery.addEventListener('change', () => syncAccordionState(footer), { signal: controller.signal });
    controllers.set(footer, controller);
    syncAccordionState(footer);
  }

  document.querySelectorAll('.nvgd-footer[data-section-id]').forEach(initFooter);

  document.addEventListener('shopify:section:load', (event) => {
    const footer = document.querySelector(`.nvgd-footer[data-section-id="${event.detail.sectionId}"]`);
    if (footer) initFooter(footer);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    const footer = document.querySelector(`.nvgd-footer[data-section-id="${event.detail.sectionId}"]`);
    if (!footer) return;
    controllers.get(footer)?.abort();
    controllers.delete(footer);
  });
})();
