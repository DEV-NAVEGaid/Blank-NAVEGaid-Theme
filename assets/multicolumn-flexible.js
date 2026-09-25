(function() {
  if (typeof Shopify === 'undefined' || !Shopify.designMode) return;

  function toggleColumnSettings() {
    setTimeout(function() {
      const contentTypeSelects = document.querySelectorAll('[name*="[content_type]"]');

      contentTypeSelects.forEach(function(select) {
        function updateVisibility() {
          const selectedType = select.value;
          const settingsContainer = select.closest('.shopify-section__block-settings') ||
                                   select.closest('[data-block-type]');

          if (!settingsContainer) return;

          const allSettings = settingsContainer.querySelectorAll('.input');
          let inTextSection = false;
          let inImageSection = false;
          let inListSection = false;

          allSettings.forEach(function(setting) {
            const labelText = setting.querySelector('label')?.textContent || '';
            const headerText = setting.querySelector('.section-header__heading')?.textContent || '';

            if (headerText.includes('Text Content') || labelText.includes('Heading') ||
                labelText.includes('Subheading') || labelText.match(/^Text \d/)) {
              if (headerText.includes('Text Content')) {
                inTextSection = true;
                inImageSection = false;
                inListSection = false;
              }
              if (inTextSection && selectedType !== 'text') {
                setting.style.display = 'none';
              } else if (inTextSection) {
                setting.style.display = '';
              }
            } else if (headerText.includes('Image Content') || labelText === 'Image') {
              if (headerText.includes('Image Content')) {
                inTextSection = false;
                inImageSection = true;
                inListSection = false;
              }
              if (inImageSection && selectedType !== 'image') {
                setting.style.display = 'none';
              } else if (inImageSection) {
                setting.style.display = '';
              }
            } else if (headerText.includes('List Content') || labelText.includes('List') ||
                       labelText.includes('Icon') || labelText.includes('SVG') ||
                       labelText === 'Show Bullet Points' || headerText.includes('List Styling') ||
                       headerText.match(/^Item \d$/) || labelText.match(/^Heading [1-4]$/) ||
                       labelText.match(/^List Text [1-4]$/)) {
              if (headerText.includes('List Content') || headerText.includes('List Styling') ||
                  headerText.match(/^Item \d$/)) {
                inTextSection = false;
                inImageSection = false;
                inListSection = true;
              }
              if (inListSection && selectedType !== 'list') {
                setting.style.display = 'none';
              } else if (inListSection) {
                setting.style.display = '';
              }
            }
          });
        }

        select.addEventListener('change', updateVisibility);
        updateVisibility();
      });
    }, 500);
  }

  toggleColumnSettings();

  document.addEventListener('shopify:section:load', toggleColumnSettings);
  document.addEventListener('shopify:block:select', toggleColumnSettings);
})();
