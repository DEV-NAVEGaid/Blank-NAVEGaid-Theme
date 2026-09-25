(function() {
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#nvgd-total-price-wrapper').forEach(function(wrapper) {
      if (wrapper.dataset.totalPriceInit) return;
      wrapper.dataset.totalPriceInit = 'true';
      var priceDisplay = document.getElementById('nvgd-total-price-value');
      if (!priceDisplay) return;

      var currencySymbol = wrapper.getAttribute('data-currency-symbol') || '€';
      var currencyPosition = wrapper.getAttribute('data-currency-position') || 'after';

      function formatPrice(cents) {
        var amount = (cents / 100).toFixed(2).replace('.', ',');
        if (currencyPosition === 'before') {
          return currencySymbol + amount;
        }
        return amount + ' ' + currencySymbol;
      }

      function parsePriceText(text) {
        if (!text) return 0;
        var cleaned = text.replace(/[€$£\s\u00a0]/g, '').trim();
        if (cleaned.length === 0) return 0;
        if (cleaned.indexOf(',') > -1) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        var value = parseFloat(cleaned);
        if (isNaN(value)) return 0;
        return Math.round(value * 100);
      }

      // ── Build variant→price map from Liquid data ────────
      var variantPrices = {};
      var variantPricesRaw = wrapper.getAttribute('data-variant-prices') || '';
      variantPricesRaw.split(',').forEach(function(pair) {
        var parts = pair.split(':');
        if (parts.length === 2) {
          variantPrices[parts[0].trim()] = parseInt(parts[1].trim(), 10) || 0;
        }
      });

      // ── Base price from Liquid (initial load) ───────────
      var cachedBasePrice = parseInt(wrapper.getAttribute('data-base-price'), 10) || 0;

      function getBasePrice() {
        return cachedBasePrice;
      }

      function updateBasePrice() {
        var variantInput = document.querySelector('form[action*="/cart/add"]:not(.installment) input[name="id"]');
        if (variantInput) {
          var vid = variantInput.value.trim();
          if (variantPrices.hasOwnProperty(vid)) {
            cachedBasePrice = variantPrices[vid];
            return;
          }
        }
      }

      function getQuantity() {
        var selectors = [
          'input[name="quantity"]',
          'quantity-input input[type="number"]',
          '.quantity__input'
        ];
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el) {
            var val = parseInt(el.value, 10);
            return val > 0 ? val : 1;
          }
        }
        return 1;
      }

      function getWarrantyPrice() {
        var selected = document.querySelector('.nvgd-warranty-input:checked');
        if (!selected || selected.value === 'none') return 0;
        return parseInt(selected.getAttribute('data-warranty-price')) || 0;
      }

      function getAddonPrices() {
        var total = 0;
        document.querySelectorAll('.nvgd-addon-content-container input[type="checkbox"]:checked').forEach(function(cb) {
          var priceAttr = cb.getAttribute('data-price');
          if (priceAttr) {
            var cleaned = priceAttr.replace(',', '.').replace(/[^\d.]/g, '');
            total += Math.round(parseFloat(cleaned) * 100) || 0;
          }
        });
        return total;
      }

      function getUpsellPrices() {
        var total = 0;
        document.querySelectorAll('.product-upsell__input:checked').forEach(function(cb) {
          var item = cb.closest('.product-upsell__item');
          if (item) {
            var priceEl = item.querySelector('.product-upsell__price');
            if (priceEl) {
              total += parsePriceText(priceEl.textContent);
            }
          }
        });
        return total;
      }

      function recalculate() {
        var base = getBasePrice();
        var qty = getQuantity();
        var warranty = getWarrantyPrice();
        var addons = getAddonPrices();
        var upsells = getUpsellPrices();
        var total = (base * qty) + warranty + addons + upsells;
        priceDisplay.textContent = formatPrice(total);

        // Sync sticky ATC price (id rendered by Liquid into data-sticky-price-id)
        var stickyPrice = wrapper.dataset.stickyPriceId
          ? document.querySelector('[id="' + CSS.escape(wrapper.dataset.stickyPriceId) + '"]')
          : null;
        if (stickyPrice) stickyPrice.textContent = formatPrice(total);
      }

      // ── EVENT LISTENERS ──────────────────────────────────

      document.querySelectorAll('.nvgd-warranty-input').forEach(function(r) {
        r.addEventListener('change', recalculate);
      });

      document.querySelectorAll('.nvgd-addon-content-container input[type="checkbox"]').forEach(function(cb) {
        cb.addEventListener('change', recalculate);
      });

      document.querySelectorAll('.product-upsell__input').forEach(function(cb) {
        cb.addEventListener('change', recalculate);
      });
      document.querySelectorAll('.product-upsell__item').forEach(function(item) {
        item.addEventListener('click', function() {
          setTimeout(recalculate, 50);
        });
      });

      var qtySelectors = [
        'input[name="quantity"]',
        'quantity-input input[type="number"]',
        '.quantity__input'
      ];
      qtySelectors.forEach(function(sel) {
        var qtyEl = document.querySelector(sel);
        if (qtyEl) {
          qtyEl.addEventListener('change', function() { setTimeout(recalculate, 150); });
          qtyEl.addEventListener('input', function() { setTimeout(recalculate, 150); });
          new MutationObserver(function() {
            setTimeout(recalculate, 150);
          }).observe(qtyEl, { attributes: true, attributeFilter: ['value'] });
        }
      });

      document.querySelectorAll('quantity-input button, .quantity__button').forEach(function(btn) {
        btn.addEventListener('click', function() { setTimeout(recalculate, 200); });
      });

      var variantInput = document.querySelector('form[action*="/cart/add"]:not(.installment) input[name="id"]');
      if (variantInput) {
        new MutationObserver(function() {
          updateBasePrice();
          recalculate();
        }).observe(variantInput, { attributes: true, attributeFilter: ['value'] });
      }

      document.addEventListener('variant:change', function() {
        updateBasePrice();
        recalculate();
      });

      var productInfo = document.querySelector('product-info');
      if (productInfo) {
        productInfo.addEventListener('change', function() {
          setTimeout(function() { updateBasePrice(); recalculate(); }, 100);
        });
      }

      // Initial render
      recalculate();
    });
  });
})();
