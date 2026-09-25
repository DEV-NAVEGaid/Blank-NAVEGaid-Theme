function initStickyAtc() {
  document.querySelectorAll('.sticky-atc-wrapper').forEach(function (stickyWrapper) {
    if (stickyWrapper.dataset.stickyAtcInit) return;
    stickyWrapper.dataset.stickyAtcInit = 'true';
    var sectionId = stickyWrapper.dataset.sectionId;
    var productRoot = document.getElementById('MainProduct-' + sectionId);
    if (!productRoot) return;
    var controller = new AbortController();
    var navObserver = null;
    if (stickyWrapper.parentNode !== document.body) document.body.appendChild(stickyWrapper);
    var stickyButton = document.getElementById('sticky-atc-button-' + sectionId);
    var mainAddToCart = productRoot.querySelector('button[name="add"], .product-form__submit');
    var navLinks = stickyWrapper.querySelectorAll('.sticky-atc__nav-link');

    var productInfo = productRoot;

    // Calculate the threshold based on product-info position
    function getShowThreshold() {
      var rect = productInfo.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Show sticky bar after scrolling past the bottom of product-info
      return scrollTop + rect.bottom;
    }

    // Show/hide sticky bar on scroll (rAF-throttled, passive)
    function applyStickyVisibility() {
      var threshold = getShowThreshold();
      stickyWrapper.classList.toggle('visible', window.scrollY > threshold);
    }

    var stickyNavTicking = false;
    function onStickyScroll() {
      if (stickyNavTicking) return;
      stickyNavTicking = true;
      window.requestAnimationFrame(function() {
        applyStickyVisibility();
        stickyNavTicking = false;
      });
    }
    window.addEventListener('scroll', onStickyScroll, { passive: true, signal: controller.signal });
    window.addEventListener('resize', onStickyScroll, { passive: true, signal: controller.signal });
    applyStickyVisibility();

    // Navigation link click handling
    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();

        var sectionName = this.getAttribute('data-section-name');
        var targetSection = document.querySelector('[id*="' + sectionName + '"]');

        if (targetSection) {
          // Calculate offset for sticky header
          var stickyHeight = stickyWrapper.offsetHeight;
          var targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - stickyHeight - 10;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL
          history.pushState(null, null, '#' + sectionName);

          // Update active state
          navLinks.forEach(function(l) { l.classList.remove('active'); });
          this.classList.add('active');
        }
      }, { signal: controller.signal });
    });

    // Active nav link via IntersectionObserver (no per-scroll layout reads)
    var navLinkBySection = {};
    var observedNavSections = [];
    navLinks.forEach(function(link) {
      var sectionName = link.getAttribute('data-section-name');
      var section = document.querySelector('[id*="' + sectionName + '"]');
      if (section) {
        navLinkBySection[sectionName] = link;
        section.setAttribute('data-sticky-nav-section', sectionName);
        observedNavSections.push(section);
      }
    });

    function setActiveNavLink(link) {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      if (link) link.classList.add('active');
    }

    if ('IntersectionObserver' in window && observedNavSections.length) {
      navObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var name = entry.target.getAttribute('data-sticky-nav-section');
            if (navLinkBySection[name]) setActiveNavLink(navLinkBySection[name]);
          }
        });
      }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
      observedNavSections.forEach(function(s) { navObserver.observe(s); });
    }

    // Add to cart button handling
    if (stickyButton) {
      stickyButton.addEventListener('click', function() {
        if (mainAddToCart) {
          mainAddToCart.click();
        } else {
          var variantId = productRoot.querySelector('input[name="id"], select[name="id"]');
          if (!variantId) return;

          var originalText = stickyWrapper.dataset.buttonText || 'Add to cart';
          this.disabled = true;
          this.textContent = stickyWrapper.dataset.buttonTextAdding || 'Adding…';

          var qtyInput = productRoot.querySelector('input[name="quantity"]');
          var quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
          var addUrl = (window.routes && window.routes.cart_add_url) ? window.routes.cart_add_url : '/cart/add';
          var root = productRoot;
          var items = [{ id: parseInt(variantId.value), quantity: quantity }];
          root.querySelectorAll('.product-upsell__input:checked, .nvgd-addon-content-container input[type="checkbox"]:checked').forEach(function(input) {
            var extraVariantId = parseInt(input.getAttribute('data-variant-id') || input.value);
            if (!input.disabled && extraVariantId && extraVariantId !== items[0].id) {
              items.push({ id: extraVariantId, quantity: 1 });
            }
          });

          fetch(addUrl.endsWith('.js') ? addUrl : addUrl + '.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ items: items })
          })
          .then(function(response) {
            if (!response.ok) throw new Error('Failed to add to cart');
            return response.json();
          })
          .then(function(cartData) {
            stickyButton.disabled = false;
            stickyButton.textContent = originalText;
            if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
              publish(PUB_SUB_EVENTS.cartUpdate, { source: 'sticky-atc', cartData: cartData });
            }
            var cartDrawer = document.querySelector('cart-drawer');
            if (cartDrawer && typeof cartDrawer.open === 'function') {
              cartDrawer.open();
            } else {
              var cartIcon = document.querySelector('#cart-icon-bubble, a[href$="/cart"]');
              if (cartIcon) cartIcon.click();
            }
          })
          .catch(function() {
            stickyButton.disabled = false;
            stickyButton.textContent = originalText;
          });
        }
      }, { signal: controller.signal });
    }
    document.addEventListener('shopify:section:unload', function(event) {
      var unloadSectionId = event.detail && event.detail.sectionId;
      var eventTarget = event.target;
      var ownsSection = unloadSectionId === sectionId ||
        (!unloadSectionId && eventTarget && typeof eventTarget.contains === 'function' &&
          eventTarget.contains(productRoot));
      if (!ownsSection) return;
      if (navObserver) navObserver.disconnect();
      stickyWrapper.remove();
      controller.abort();
    }, { signal: controller.signal });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStickyAtc, { once: true });
} else {
  initStickyAtc();
}

// Sticky ATC independent price calculation
(function() {
  function initStickyPrice() {
    document.querySelectorAll('.sticky-atc-wrapper').forEach(function (stickyWrapper) {
      if (stickyWrapper.dataset.stickyPriceInit) return;
      stickyWrapper.dataset.stickyPriceInit = 'true';
      var sectionId = stickyWrapper.dataset.sectionId;
      var productRoot = document.getElementById('MainProduct-' + sectionId);
      var stickyPrice = document.getElementById('sticky-atc-price-' + sectionId);
      if (!productRoot || !stickyPrice) return;

      // If total price box exists, let it handle syncing instead
      if (productRoot.querySelector('#nvgd-total-price-wrapper')) return;
      var controller = new AbortController();

      var currencySymbol = stickyPrice.getAttribute('data-currency-symbol') || '€';
      var basePrice = parseInt(stickyPrice.getAttribute('data-base-price'), 10) || 0;

      var variantPrices = {};
      (stickyPrice.getAttribute('data-variant-prices') || '').split(',').forEach(function(pair) {
        var parts = pair.split(':');
        if (parts.length === 2) variantPrices[parts[0].trim()] = parseInt(parts[1].trim(), 10) || 0;
      });

      function formatPrice(cents) {
        var amount = (cents / 100).toFixed(2).replace('.', ',');
        return amount + ' ' + currencySymbol;
      }

      function parsePriceText(text) {
        if (!text) return 0;
        var cleaned = text.replace(/[€$£\s\u00a0]/g, '').trim();
        if (cleaned.indexOf(',') > -1) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        var value = parseFloat(cleaned);
        return isNaN(value) ? 0 : Math.round(value * 100);
      }

      function updateBasePrice() {
        var input = productRoot.querySelector('form[action*="/cart/add"]:not(.installment) input[name="id"]');
        if (input && variantPrices[input.value.trim()]) {
          basePrice = variantPrices[input.value.trim()];
        }
      }

      function getQuantity() {
        var el = productRoot.querySelector('input[name="quantity"]');
        var val = el ? parseInt(el.value, 10) : 1;
        return val > 0 ? val : 1;
      }

      function recalculate() {
        var qty = getQuantity();
        var warranty = 0;
        var addons = 0;
        var upsells = 0;

        // Warranty
        var selectedWarranty = productRoot.querySelector('.nvgd-warranty-input:checked');
        if (selectedWarranty && selectedWarranty.value !== 'none') {
          warranty = parseInt(selectedWarranty.getAttribute('data-warranty-price')) || 0;
        }

        // Add-ons
        productRoot.querySelectorAll('.nvgd-addon-content-container input[type="checkbox"]:checked').forEach(function(cb) {
          var p = cb.getAttribute('data-price');
          if (p) {
            var cleaned = p.replace(',', '.').replace(/[^\d.]/g, '');
            addons += Math.round(parseFloat(cleaned) * 100) || 0;
          }
        });

        // Upsells
        productRoot.querySelectorAll('.product-upsell__input:checked').forEach(function(cb) {
          var item = cb.closest('.product-upsell__item');
          if (item) {
            var priceEl = item.querySelector('.product-upsell__price');
            if (priceEl) upsells += parsePriceText(priceEl.textContent);
          }
        });

        var total = (basePrice * qty) + warranty + addons + upsells;
        stickyPrice.textContent = formatPrice(total);
      }

      // ── Event delegation (catches elements added after DOMContentLoaded) ──
      productRoot.addEventListener('change', function() {
        setTimeout(function() { updateBasePrice(); recalculate(); }, 100);
      }, { signal: controller.signal });

      productRoot.addEventListener('input', function(e) {
        if (e.target.matches('input[name="quantity"]') || e.target.matches('.quantity__input')) {
          setTimeout(recalculate, 150);
        }
      }, { signal: controller.signal });

      productRoot.addEventListener('click', function(e) {
        // Upsell item clicks (checkbox toggles via parent)
        if (e.target.closest('.product-upsell__item')) {
          setTimeout(recalculate, 50);
        }
        // Quantity buttons
        if (e.target.closest('quantity-input button') || e.target.closest('.quantity__button')) {
          setTimeout(recalculate, 200);
        }
      }, { signal: controller.signal });

      // ── Variant changes ──
      var variantInput = productRoot.querySelector('form[action*="/cart/add"]:not(.installment) input[name="id"]');

      document.addEventListener('variant:change', function() { updateBasePrice(); recalculate(); }, { signal: controller.signal });


      updateBasePrice();
      recalculate();

      var pollId = null;
      if (variantInput) {
        var lastVariantValue = variantInput.value;
        pollId = window.setInterval(function() {
          if (variantInput.value !== lastVariantValue) {
            lastVariantValue = variantInput.value;
            updateBasePrice();
            recalculate();
          }
        }, 300);
      }

      document.addEventListener('shopify:section:unload', function(event) {
        var unloadSectionId = event.detail && event.detail.sectionId;
        var eventTarget = event.target;
        var ownsSection = unloadSectionId === sectionId ||
          (!unloadSectionId && eventTarget && typeof eventTarget.contains === 'function' &&
            eventTarget.contains(productRoot));
        if (!ownsSection) return;
        if (pollId !== null) window.clearInterval(pollId);
        controller.abort();
      }, { signal: controller.signal });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyPrice, { once: true });
  } else {
    initStickyPrice();
  }
})();
