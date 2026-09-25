// Mobile title truncation
(function() {
  function truncateUpsellTitles() {
    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    var titles = document.querySelectorAll('.product-upsell__title');

    titles.forEach(function(titleEl) {
      var fullText = titleEl.getAttribute('data-full-text') || titleEl.textContent.trim();

      // Always save the original full text once
      if (!titleEl.getAttribute('data-full-text')) {
        titleEl.setAttribute('data-full-text', fullText);
      }

      if (isMobile) {
        var words = fullText.split(/\s+/);
        if (words.length > 5) {
          titleEl.textContent = words.slice(0, 3).join(' ') + '...';
          titleEl.setAttribute('title', fullText);
        } else {
          titleEl.textContent = fullText;
        }
      } else {
        // Reset to full text on larger screens
        titleEl.textContent = fullText;
      }
    });
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', truncateUpsellTitles);
  } else {
    truncateUpsellTitles();
  }

  // Re-run on resize (debounced)
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(truncateUpsellTitles, 200);
  });
})();

(function() {
  function updateUpsellItemState(checkboxId) {
    var checkbox = document.getElementById(checkboxId);
    var item = checkbox.closest('.product-upsell__item');
    if (checkbox.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  }

  // Row toggling and the help modal used to run from onclick attributes
  // through three globals. Same behaviour, delegated from each block root
  // so a second instance on the page drives its own rows, and the Escape
  // listener only exists while the modal is open.
  (function() {
    var roots = document.querySelectorAll('[data-upsell-root]');
    var modal = document.getElementById('upsell-modal');

    function onKeydown(e) {
      if (e.key === 'Escape') closeModal();
    }

    function openModal(btn) {
      if (!modal) return;
      document.getElementById('upsell-modal-img').src = btn.getAttribute('data-modal-image');
      document.getElementById('upsell-modal-title').textContent = btn.getAttribute('data-modal-title');
      document.getElementById('upsell-modal-desc').textContent = btn.getAttribute('data-modal-desc');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
    }

    roots.forEach(function(root) {
      root.addEventListener('click', function(event) {
        var helpBtn = event.target.closest('.product-upsell__help-btn');
        if (helpBtn && root.contains(helpBtn)) {
          openModal(helpBtn);
          return;
        }

        var item = event.target.closest('.product-upsell__item');
        if (!item || !root.contains(item)) return;

        var checkbox = item.querySelector('.product-upsell__input');
        if (!checkbox) return;

        // The checkbox fires its own change handler; the variant select
        // must not toggle the row at all.
        if (event.target.classList.contains('product-upsell__input')) {
          updateUpsellItemState(checkbox.id);
          return;
        }
        if (event.target.classList.contains('product-upsell__variant-select')) return;

        if (!checkbox.disabled) {
          checkbox.checked = !checkbox.checked;
          updateUpsellItemState(checkbox.id);
        }
      });
    });

    if (modal) {
      modal.querySelector('[data-upsell-modal-close]')?.addEventListener('click', closeModal);
      modal.addEventListener('click', function(event) {
        if (event.target === modal) closeModal();
      });
    }
  })();

  // Initialize checkbox states + variant selectors
  document.addEventListener('DOMContentLoaded', function() {
    // Checkbox change listeners
    document.querySelectorAll('.product-upsell__input').forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        updateUpsellItemState(this.id);
      });
      if (checkbox.disabled) {
        checkbox.closest('.product-upsell__item').classList.add('disabled');
      }
    });

    // Variant selector change listeners
    document.querySelectorAll('.product-upsell__variant-select').forEach(function(select) {
      select.addEventListener('change', function() {
        var index = this.dataset.upsellIndex;
        var selectedOption = this.options[this.selectedIndex];
        var selectedVariantId = this.value;
        var imageUrl = selectedOption.dataset.image;
        var price = selectedOption.dataset.price;
        var isAvailable = selectedOption.dataset.available === 'true';

        // Find the matching checkbox and update variant ID
        var checkboxes = document.querySelectorAll('.product-upsell__input[data-upsell-index="' + index + '"]');
        checkboxes.forEach(function(cb) {
          cb.setAttribute('data-variant-id', selectedVariantId);
          if (isAvailable) {
            cb.disabled = false;
            cb.closest('.product-upsell__item').classList.remove('disabled');
          } else {
            cb.disabled = true;
            cb.checked = false;
            cb.closest('.product-upsell__item').classList.add('disabled');
            cb.closest('.product-upsell__item').classList.remove('selected');
          }
        });

        // Update image
        var img = document.querySelector('.product-upsell__img[data-upsell-index="' + index + '"]');
        if (img && imageUrl) {
          img.style.opacity = '0';
          setTimeout(function() {
            img.src = imageUrl;
            img.style.opacity = '1';
          }, 150);
        }

        // Update price
        var priceEl = document.querySelector('.product-upsell__price[data-upsell-index="' + index + '"]');
        if (priceEl && price) {
          priceEl.style.opacity = '0';
          setTimeout(function() {
            priceEl.textContent = price;
            priceEl.style.opacity = '1';
          }, 150);
        }
      });
    });
  });
})();
