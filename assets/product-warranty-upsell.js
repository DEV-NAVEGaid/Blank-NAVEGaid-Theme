// Warranty selection handler
(function() {
  const warrantyWrappers = document.querySelectorAll('[data-warranty-wrapper]');
  if (!warrantyWrappers.length) return;

  // Modal wiring. Held by reference rather than looked up by id on every call,
  // and closed by a keydown listener that only exists while the modal is open —
  // the previous version bound one to document for the life of the page.
  const modal = document.getElementById('warranty-modal');
  if (modal && !modal.dataset.warrantyWired) {
    modal.dataset.warrantyWired = 'true';

    function onKeydown(event) {
      if (event.key === 'Escape') closeModal();
    }

    function openModal() {
      if (!modal) return;
      document.body.appendChild(modal);
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

    modal.querySelector('[data-warranty-close]')?.addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    modal._openWarrantyModal = openModal;
  }

  warrantyWrappers.forEach(function (warrantyWrapper) {
    if (warrantyWrapper.dataset.warrantyInit) return;
    warrantyWrapper.dataset.warrantyInit = 'true';

    warrantyWrapper.querySelector('[data-warranty-open]')?.addEventListener('click', function () {
      modal && modal._openWarrantyModal && modal._openWarrantyModal();
    });

    const warrantyInputs = warrantyWrapper.querySelectorAll('.nvgd-warranty-input');
    const warrantyCards = warrantyWrapper.querySelectorAll('.nvgd-warranty-card');
    const warrantyHiddenField = warrantyWrapper.querySelector('input[name="properties[_warranty]"]');
    const warrantyTotalPrice = warrantyWrapper.querySelector('[data-warranty-extra]');

    warrantyInputs.forEach((input, index) => {
      input.addEventListener('change', function() {
        warrantyCards.forEach(card => card.classList.remove('nvgd-warranty-card--selected'));

        if (this.checked) {
          warrantyCards[index].classList.add('nvgd-warranty-card--selected');

          const warrantyTitle = this.dataset.warrantyTitle;
          if (warrantyHiddenField) {
            warrantyHiddenField.value = warrantyTitle;
          }

          const warrantyPrice = parseInt(this.dataset.warrantyPrice) || 0;
          const priceInEuros = (warrantyPrice / 100).toFixed(0);
          if (warrantyTotalPrice) {
            warrantyTotalPrice.textContent = priceInEuros + ' €';
            warrantyTotalPrice.dataset.warrantyExtra = warrantyPrice;
          }

          document.dispatchEvent(new CustomEvent('warranty:changed', {
            detail: {
              price: warrantyPrice,
              title: warrantyTitle,
              variantId: this.value
            }
          }));
        }
      });
    });
  });
})();

/**
 * Warranty Upsell Cart Integration
 * Observes Dawn's add-to-cart, then adds warranty as follow-up
 */
(function() {
  var originalFetch = window.fetch;
  var isWarrantyRequest = false;

  window.fetch = function(url, options) {
    var result = originalFetch.apply(this, arguments);

    if (
      !isWarrantyRequest &&
      typeof url === 'string' &&
      url.includes('/cart/add') &&
      options &&
      options.method &&
      options.method.toUpperCase() === 'POST'
    ) {
      result.then(function(response) {
        if (!response.ok) return;

        var selectedWarranty = document.querySelector('.nvgd-warranty-input:checked');
        if (!selectedWarranty || selectedWarranty.value === 'none') return;

        var warrantyId = parseInt(selectedWarranty.value);
        if (!warrantyId) return;

        // Skip if the request already includes the warranty (product upsell handled it)
        try {
          var requestBody = options.body;
          var itemsInRequest;
          if (typeof FormData !== 'undefined' && requestBody instanceof FormData) {
            itemsInRequest = [{ id: requestBody.get('id') }];
          } else {
            var parsedBody = JSON.parse(requestBody);
            itemsInRequest = parsedBody.items || [parsedBody];
          }
          var alreadyIncluded = itemsInRequest.some(function(item) {
            return parseInt(item.id) === warrantyId;
          });
          if (alreadyIncluded) return;
        } catch(e) {}

        // Clone so Dawn can still read the original response
        response.clone().json().then(function() {
          // Dawn's request is fully complete — add warranty immediately
          isWarrantyRequest = true;

          originalFetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{
                id: warrantyId,
                quantity: 1,
                properties: { '_warranty_addon': 'true' }
              }]
            })
          })
          .then(function(warrantyResponse) {
            isWarrantyRequest = false;
            if (!warrantyResponse.ok) return;
            return originalFetch('/?sections=cart-drawer,cart-icon-bubble');
          })
          .then(function(r) { return r ? r.json() : null; })
          .then(function(sections) {
            if (!sections) return;
            var parser = new DOMParser();

            if (sections['cart-drawer']) {
              var doc = parser.parseFromString(sections['cart-drawer'], 'text/html');
              var newDrawer = doc.querySelector('#CartDrawer');
              var currentDrawer = document.querySelector('#CartDrawer');
              if (newDrawer && currentDrawer) {
                currentDrawer.innerHTML = newDrawer.innerHTML;
                var overlay = document.getElementById('CartDrawer-Overlay');
                var cartDrawer = document.querySelector('cart-drawer');
                if (overlay && cartDrawer) {
                  overlay.addEventListener('click', cartDrawer.close.bind(cartDrawer));
                }
              }
            }

            if (sections['cart-icon-bubble']) {
              var bubbleDoc = parser.parseFromString(sections['cart-icon-bubble'], 'text/html');
              var newBubble = bubbleDoc.querySelector('.shopify-section');
              var currentBubble = document.getElementById('cart-icon-bubble');
              if (newBubble && currentBubble) {
                currentBubble.innerHTML = newBubble.innerHTML;
              }
            }

            if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
              publish(PUB_SUB_EVENTS.cartUpdate, { source: 'warranty-upsell' });
            }
          })
          .catch(function(err) {
            isWarrantyRequest = false;
            console.error('[Warranty] Error:', err);
          });
        });
      });
    }

    return result;
  };
})();
