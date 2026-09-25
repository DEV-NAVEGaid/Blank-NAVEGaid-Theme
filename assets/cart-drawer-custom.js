/* moved verbatim from inline <script> in snippets/cart-drawer.liquid */
/* The snippet renders from layout/theme.liquid AND sections/cart-drawer.liquid,
   so a page can contain two copies of this script tag - guard double init. */
(function () {
  if (document.documentElement.dataset.cartDrawerCustomInit) return;
  document.documentElement.dataset.cartDrawerCustomInit = 'true';


document.addEventListener('DOMContentLoaded', function() {
  // Load product recommendations
  loadCartRecommendations();

  // Handle Add to Cart for recommendation products (event delegation)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-add-custom')) {
      handleAddToCart(e.target);
    }
  });

  async function loadCartRecommendations() {
    const recommendationsContainer = document.querySelector('.cart-recommendations');
    if (!recommendationsContainer) return;

    const manualRecommendations = recommendationsContainer.querySelector('.manual-recommendations');

    try {
      const cartResponse = await fetch('/cart.js');
      const cart = await cartResponse.json();

      if (cart.items.length === 0) {
        recommendationsContainer.closest('.recommendations-container')?.remove();
        return;
      }

      // Try Search & Discovery first
      const productId = cart.items[0].product_id;
      const baseUrl = recommendationsContainer.dataset.url;

      const response = await fetch(`${baseUrl}?product_id=${productId}&limit=4&section_id=cart-drawer-recommendations`);

      if (response.ok) {
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const recommendations = doc.querySelector('.product-recommendations');

        if (recommendations && recommendations.innerHTML.trim()) {
          // S&D returned results - hide manual, show S&D
          if (manualRecommendations) {
            manualRecommendations.style.display = 'none';
          }

          // Insert S&D recommendations
          const sdContainer = document.createElement('div');
          sdContainer.className = 'sd-recommendations';
          sdContainer.innerHTML = recommendations.innerHTML;
          recommendationsContainer.insertBefore(sdContainer, manualRecommendations);

          // Filter out products already in cart
          filterCartProducts(sdContainer, cart.items);

          // If no S&D products visible after filtering, show manual
          const visibleSdCards = sdContainer.querySelectorAll('.product-card-custom:not([style*="display: none"])');
          if (visibleSdCards.length === 0) {
            sdContainer.remove();
            if (manualRecommendations) {
              manualRecommendations.style.display = '';
              filterCartProducts(manualRecommendations, cart.items);
            }
          }
        } else {
          // S&D returned nothing - use manual recommendations
          if (manualRecommendations) {
            filterCartProducts(manualRecommendations, cart.items);
          }
        }
      } else {
        // S&D request failed - use manual recommendations
        if (manualRecommendations) {
          filterCartProducts(manualRecommendations, cart.items);
        }
      }

      // Check if any recommendations are visible at all
      const visibleCards = recommendationsContainer.querySelectorAll('.product-card-custom:not([style*="display: none"])');
      if (visibleCards.length === 0) {
        recommendationsContainer.closest('.recommendations-container')?.remove();
      }

    } catch (error) {
      console.error('Error loading recommendations:', error);
      // On error, manual recommendations should still work (already rendered server-side)
      if (manualRecommendations) {
        manualRecommendations.style.display = '';
      }
    }
  }

  function filterCartProducts(container, cartItems) {
    const cartProductIds = cartItems.map(item => item.product_id);
    container.querySelectorAll('.product-card-custom').forEach(card => {
      const productId = parseInt(card.dataset.productId);
      if (cartProductIds.includes(productId)) {
        card.style.display = 'none';
      }
    });
  }

  async function handleAddToCart(button) {
    const variantId = button.dataset.variantId;

    if (!variantId) {
      console.error('No variant ID found');
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Adding…';

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.refresh === 'function') {
        await cartDrawer.refresh();
      } else {
        await refreshCartDrawer();
      }

      // Hide the product card that was just added
      const productCard = button.closest('.product-card-custom');
      if (productCard) {
        productCard.style.display = 'none';
      }

      // Check if any recommendations are still visible
      const recommendationsContainer = document.querySelector('.cart-recommendations');
      if (recommendationsContainer) {
        const visibleCards = recommendationsContainer.querySelectorAll('.product-card-custom:not([style*="display: none"])');
        if (visibleCards.length === 0) {
          recommendationsContainer.closest('.recommendations-container')?.remove();
        }
      }

      button.textContent = 'Added!';

    } catch (error) {
      console.error('Error adding to cart:', error);
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1500);
    }
  }

  async function refreshCartDrawer() {
    try {
      const response = await fetch('/?sections=cart-drawer');
      const data = await response.json();

      if (data['cart-drawer']) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data['cart-drawer'], 'text/html');

        const newCartItems = doc.getElementById('CartDrawer-CartItems');
        const currentCartItems = document.getElementById('CartDrawer-CartItems');
        if (newCartItems && currentCartItems) {
          currentCartItems.innerHTML = newCartItems.innerHTML;
        }

        updateCartCount();
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
      location.reload();
    }
  }

  async function updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();

      document.querySelectorAll('.cart-count-bubble, [data-cart-count]').forEach(el => {
        el.textContent = cart.item_count;
        el.style.display = cart.item_count > 0 ? '' : 'none';
      });

      const priceDisplay = document.querySelector('.cart-price-custom');
      if (priceDisplay) {
        priceDisplay.textContent = Shopify.formatMoney ?
          Shopify.formatMoney(cart.total_price) :
          '$' + (cart.total_price / 100).toFixed(2);
      }

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.classList.toggle('is-empty', cart.item_count === 0);
      }
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }
});

})();
