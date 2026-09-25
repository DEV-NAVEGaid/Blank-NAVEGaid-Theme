if (!customElements.get('deferred-media')) {
  customElements.define('deferred-media', class DeferredMedia extends HTMLElement {
    constructor() {
      super();
      const poster = this.querySelector('button');
      if (poster) {
        poster.addEventListener('click', this.loadContent.bind(this));
      }
    }

    loadContent(focus = true) {
      if (window.pauseAllMedia) window.pauseAllMedia();
      if (!this.getAttribute('loaded')) {
        const content = document.createElement('div');
        content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));
        this.setAttribute('loaded', true);
        const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
        if (focus) deferredElement.focus();
      }
    }
  });
}

window.pauseAllMedia = window.pauseAllMedia || function() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
};
