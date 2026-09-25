(function() {
  // Wait for DOM and ensure no conflicts
  function initAccordions() {
    const accordions = document.querySelectorAll('[data-accordion]');

    accordions.forEach(accordion => {
      const trigger = accordion.querySelector('[data-accordion-trigger]');
      const content = accordion.querySelector('[data-accordion-content]');

      if (!trigger || !content) return;

      // Remove any existing listeners by cloning
      const newTrigger = trigger.cloneNode(true);
      trigger.parentNode.replaceChild(newTrigger, trigger);

      newTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const isOpen = accordion.classList.contains('is-open');

        // Close others
        accordions.forEach(acc => {
          if (acc !== accordion && acc.classList.contains('is-open')) {
            acc.classList.remove('is-open');
          }
        });

        // Toggle
        accordion.classList.toggle('is-open', !isOpen);

        return false;
      }, true);
    });
  }

  // Multiple init attempts to handle dynamic loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordions);
  } else {
    initAccordions();
  }

  // Also init after a short delay for Shopify's dynamic loading
  setTimeout(initAccordions, 500);
  setTimeout(initAccordions, 1000);
})();
