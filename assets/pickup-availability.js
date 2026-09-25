if (!customElements.get('pickup-availability')) {
  customElements.define(
    'pickup-availability',
    class PickupAvailability extends HTMLElement {
      constructor() {
        super();

        const template = this.querySelector('template');
        this.errorHtml = template?.content.firstElementChild?.cloneNode(true);
        this.onClickRefreshList = this.onClickRefreshList.bind(this);
        if (this.hasAttribute('available')) {
          this.fetchAvailability(this.dataset.variantId);
        }
      }

      fetchAvailability(variantId) {
        if (!variantId) return;

        this.dataset.variantId = variantId;
        this.fetchController?.abort();
        this.drawer?.remove();
        this.drawer = null;
        const controller = new AbortController();
        this.fetchController = controller;

        let rootUrl = this.dataset.rootUrl;
        if (!rootUrl.endsWith('/')) {
          rootUrl = rootUrl + '/';
        }
        const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

        fetch(variantSectionUrl, { signal: controller.signal })
          .then((response) => response.text())
          .then((text) => {
            if (controller.signal.aborted || this.dataset.variantId !== String(variantId)) return;
            const sectionInnerHTML = new DOMParser()
              .parseFromString(text, 'text/html')
              .querySelector('.shopify-section');
            this.renderPreview(sectionInnerHTML);
          })
          .catch((e) => {
            if (e.name === 'AbortError' || controller.signal.aborted) return;
            const button = this.querySelector('button');
            if (button) button.removeEventListener('click', this.onClickRefreshList);
            this.renderError();
          });
      }

      onClickRefreshList() {
        this.fetchAvailability(this.dataset.variantId);
      }

      update(variant) {
        if (variant?.available) {
          this.fetchAvailability(variant.id);
        } else {
          this.fetchController?.abort();
          this.drawer?.remove();
          this.drawer = null;
          this.removeAttribute('available');
          this.innerHTML = '';
        }
      }
      renderError() {
        if (!this.errorHtml) return;
        this.innerHTML = '';
        this.appendChild(this.errorHtml.cloneNode(true));

        this.querySelector('button')?.addEventListener('click', this.onClickRefreshList);
      }

      renderPreview(sectionInnerHTML) {
        const preview = sectionInnerHTML?.querySelector('pickup-availability-preview');
        const drawer = sectionInnerHTML?.querySelector('pickup-availability-drawer');
        if (!preview || !drawer) {
          this.innerHTML = '';
          this.removeAttribute('available');
          return;
        }

        this.innerHTML = preview.outerHTML;
        this.setAttribute('available', '');

        document.body.appendChild(drawer);
        this.drawer = drawer;
        const colorClassesToApply = (this.dataset.productPageColorScheme || '').split(' ').filter(Boolean);
        colorClassesToApply.forEach((colorClass) => this.drawer.classList.add(colorClass));

        const button = this.querySelector('button');
        if (button)
          button.addEventListener('click', (evt) => {
            this.drawer?.show(evt.target);
          });
      }
    }
  );
}

if (!customElements.get('pickup-availability-drawer')) {
  customElements.define(
    'pickup-availability-drawer',
    class PickupAvailabilityDrawer extends HTMLElement {
      constructor() {
        super();

        this.onBodyClick = this.handleBodyClick.bind(this);

        this.querySelector('button').addEventListener('click', () => {
          this.hide();
        });

        this.addEventListener('keyup', (event) => {
          if (event.code.toUpperCase() === 'ESCAPE') this.hide();
        });
      }

      handleBodyClick(evt) {
        const target = evt.target;
        if (
          target != this &&
          !target.closest('pickup-availability-drawer') &&
          target.id != 'ShowPickupAvailabilityDrawer'
        ) {
          this.hide();
        }
      }

      hide() {
        this.removeAttribute('open');
        document.body.removeEventListener('click', this.onBodyClick);
        document.body.classList.remove('overflow-hidden');
        removeTrapFocus(this.focusElement);
      }

      show(focusElement) {
        this.focusElement = focusElement;
        this.setAttribute('open', '');
        document.body.addEventListener('click', this.onBodyClick);
        document.body.classList.add('overflow-hidden');
        trapFocus(this);
      }
    }
  );
}
