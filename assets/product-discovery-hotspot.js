if (!customElements.get('product-discovery-hotspot')) {
  customElements.define('product-discovery-hotspot', class extends HTMLElement {
    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      const items = this.querySelectorAll('[data-hotspot-item]');
      const cards = this.querySelectorAll('[data-hotspot-card]');
      const popups = this.querySelectorAll('[data-hotspot-popup]');
      const thumbs = this.querySelectorAll('[data-hotspot-thumb]');
      const desktop = window.matchMedia('(min-width: 990px)');
      const usesFloatingPreviews = this.dataset.displayMode === 'floating-preview';
      let activeIndex = items[0]?.dataset.index;
      let suppressFocusOpen = false;

      const closePopups = (restoreFocus = false) => {
        const openItem = this.querySelector('[data-hotspot-item].show-popup');
        items.forEach((item) => {
          item.classList.remove('show-popup');
          item.querySelector('button')?.setAttribute('aria-expanded', 'false');
        });
        popups.forEach((popup) => popup.setAttribute('aria-hidden', 'true'));
        if (restoreFocus && openItem) {
          suppressFocusOpen = true;
          openItem.querySelector('button')?.focus();
          suppressFocusOpen = false;
        }
      };

      const activate = (index, source = 'selection') => {
        const targetItem = [...items].find((item) => item.dataset.index === index);
        if (!targetItem) return;

        const canOpenPopup = usesFloatingPreviews
          && desktop.matches
          && !['initial', 'pointer-focus', 'resize'].includes(source);
        const openPopup = canOpenPopup;
        activeIndex = index;

        items.forEach((item) => {
          const active = item.dataset.index === index;
          item.classList.toggle('is-active', active);
          item.classList.toggle('show-popup', active && openPopup);
          const button = item.querySelector('button');
          button?.setAttribute('aria-pressed', String(active));
          if (button?.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', String(active && openPopup));
        });
        popups.forEach((popup) => {
          popup.setAttribute('aria-hidden', String(!(popup.dataset.index === index && openPopup)));
        });
        cards.forEach((card) => {
          const active = card.dataset.index === index;
          card.classList.toggle('is-active', active);
          card.hidden = !active;
        });
        thumbs.forEach((thumb) => {
          const active = thumb.dataset.index === index;
          thumb.classList.toggle('is-active', active);
          thumb.setAttribute('aria-pressed', String(active));
        });
      };
      items.forEach((item) => {
        const button = item.querySelector('button');
        button?.addEventListener('click', () => activate(item.dataset.index, 'pin-click'), options);
        button?.addEventListener('focus', () => {
          if (!suppressFocusOpen) {
            activate(item.dataset.index, button.matches(':focus-visible') ? 'pin-focus' : 'pointer-focus');
          }
        }, options);
        item.addEventListener('pointerenter', (event) => {
          if (event.pointerType === 'mouse' && this.dataset.interaction === 'hover') {
            activate(item.dataset.index, 'pin-hover');
          }
        }, options);
        item.addEventListener('pointerleave', (event) => {
          if (event.pointerType === 'mouse' && this.dataset.interaction === 'hover') closePopups();
        }, options);
      });

      thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => activate(thumb.dataset.index, 'thumb-click'), options);
        thumb.addEventListener('focus', () => activate(thumb.dataset.index, 'thumb-focus'), options);
        thumb.addEventListener('pointerenter', (event) => {
          if (event.pointerType === 'mouse' && this.dataset.interaction === 'hover') {
            activate(thumb.dataset.index, 'thumb-hover');
          }
        }, options);
      });

      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePopups(true);
      }, options);
      document.addEventListener('pointerdown', (event) => {
        if (!this.contains(event.target)) closePopups();
      }, options);
      this.addEventListener('shopify:block:select', (event) => {
        const item = event.target.closest('[data-hotspot-item]');
        if (item) activate(item.dataset.index, 'editor');
      }, options);
      desktop.addEventListener('change', () => activate(activeIndex, 'resize'), options);

      if (activeIndex !== undefined) activate(activeIndex, 'initial');
    }

    disconnectedCallback() {
      this.controller?.abort();
    }
  });
}
