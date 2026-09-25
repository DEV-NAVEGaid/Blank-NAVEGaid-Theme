if (!customElements.get('before-after-results')) {
  customElements.define('before-after-results', class extends HTMLElement {
    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();
      const input = this.querySelector('input[type="range"]');
      if (!input) return;
      const update = () => this.style.setProperty('--comparison-position', `${input.value}%`);
      input.addEventListener('input', update, { signal: this.controller.signal });
      update();
    }

    disconnectedCallback() {
      this.controller?.abort();
    }
  });
}
