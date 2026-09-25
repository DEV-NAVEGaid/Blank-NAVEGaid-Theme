/* moved from inline <script> for bundling */
document.querySelectorAll('.insights-gallery-section').forEach(function (section) {
  const cards = section.querySelectorAll('.insight-card');
  const contents = section.querySelectorAll('.insight-content');

  cards.forEach(card => {
    card.addEventListener('click', function() {
      const insightId = this.getAttribute('data-insight-id');

      cards.forEach(c => c.classList.remove('active-card'));
      this.classList.add('active-card');

      contents.forEach(content => {
        content.classList.remove('active-content');
      });

      const activeContent = section.querySelector(`[data-insight-content="${insightId}"]`);
      if (activeContent) {
        activeContent.classList.add('active-content');
      }
    });
  });

  if (section.dataset.autoRotate === 'true') {
    let currentIndex = 0;
    const rotationInterval = parseInt(section.dataset.rotationSpeed, 10);

    setInterval(() => {
      currentIndex = (currentIndex + 1) % cards.length;
      cards[currentIndex].click();
    }, rotationInterval);
  }
});
