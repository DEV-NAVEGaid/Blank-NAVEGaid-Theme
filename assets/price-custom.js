(function () {
  // Klarna price modal. Multiple price blocks can render this snippet, so every
  // open link and close control is bound; the Escape listener only exists while
  // the modal is open.
  const modals = document.querySelectorAll('[data-klarna-modal]');
  if (!modals.length) return;

  modals.forEach(function (modal) {
    function onKeydown(event) {
      if (event.key === 'Escape') closeModal();
    }

    function openModal(event) {
      event.preventDefault();
      document.body.appendChild(modal);
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKeydown);
    }

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
    }

    document.querySelectorAll('[data-klarna-open]').forEach(function (openLink) {
      openLink.addEventListener('click', openModal);
    });
    modal.querySelector('[data-klarna-close]')?.addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
  });
})();
