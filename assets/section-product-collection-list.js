/* moved from sections/product-collection-list-alt.liquid inline <script> for bundling */
(function () {
  function init(root) {
    if (!root || root.dataset.pclInit) return;
    root.dataset.pclInit = 'true';

    var sectionId = root.dataset.sectionId;
    var filteringMode = root.dataset.filteringMode;
    var faqBehavior = root.dataset.faqBehavior;

    // ==========================================
    // FAQ ACCORDION FUNCTIONALITY
    // ==========================================
    var faqToggles = root.querySelectorAll('.cb-faq-toggle');

    faqToggles.forEach(function (button) {
      button.addEventListener('click', function () {
        var row = this.closest('.cb-faq-row');
        var content = row.querySelector('.cb-faq-content');
        var isExpanded = this.getAttribute('aria-expanded') === 'true';

        if (faqBehavior === 'single') {
          // Close all other FAQ rows
          faqToggles.forEach(function (otherButton) {
            if (otherButton !== button) {
              var otherRow = otherButton.closest('.cb-faq-row');
              var otherContent = otherRow.querySelector('.cb-faq-content');
              otherButton.setAttribute('aria-expanded', 'false');
              otherRow.classList.remove('active');
              if (otherContent) otherContent.style.maxHeight = null;
            }
          });
        }

        // Toggle current row
        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          row.classList.remove('active');
          content.style.maxHeight = null;
        } else {
          this.setAttribute('aria-expanded', 'true');
          row.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });


    var sidebar = root.querySelector('.collection-sidebar');
    var overlay = root.querySelector('.filter-overlay');
    var filterToggleBtn = root.querySelector('.filter-toggle-btn');
    var filterCloseBtn = root.querySelector('.filter-close-btn');
    var sortToggle = root.querySelector('.sort-button');
    var sortDropdown = root.querySelector('.sort-dropdown');

    var isMobile = function () { return window.innerWidth <= 768; };

    var ac = new AbortController();
    root.addEventListener('shopify:section:unload', function () {
      ac.abort();
      delete root.dataset.pclInit;
    }, { once: true });

    // ==========================================
    // SHARED UI: Filter drawer open/close
    // ==========================================
    function openFilter() {
      if (sidebar) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        if (filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'true');
      }
    }

    function closeFilter() {
      if (sidebar) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'false');
      }
    }

    // Filter toggle button event listener (button is always in HTML now)
    if (filterToggleBtn) filterToggleBtn.addEventListener('click', openFilter);
    if (filterCloseBtn) filterCloseBtn.addEventListener('click', closeFilter);
    if (overlay) overlay.addEventListener('click', closeFilter);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeFilter();
    }, { signal: ac.signal });

    // Filter group toggles (expand/collapse)
    root.querySelectorAll('.filter-group-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var isOpen = this.classList.toggle('active');
        this.setAttribute('aria-expanded', String(isOpen));
        var targetId = this.getAttribute('data-target');
        var content = document.getElementById(targetId);
        if (content) content.classList.toggle('open', isOpen);
      });
    });

    // Sort dropdown toggle
    if (sortToggle && sortDropdown) {
      sortToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        sortDropdown.classList.toggle('open');
        this.classList.toggle('active');
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.collection-sort')) {
          sortDropdown.classList.remove('open');
          sortToggle.classList.remove('active');
        }
      }, { signal: ac.signal });
    }

    // Window resize
    window.addEventListener('resize', function () {
      if (!isMobile() && sidebar && sidebar.classList.contains('open')) {
        closeFilter();
      }
    }, { signal: ac.signal });

    // ==========================================
    // SERVER-SIDE MODE: URL-based filter removal
    // Page reloads with updated URL parameters
    // ==========================================
    if (filteringMode === 'server') {
      // Handle active filter tag removal
      root.querySelectorAll('.js-remove-filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var url = new URL(window.location.href);
          var paramName = this.getAttribute('data-param-name');
          var paramValue = this.getAttribute('data-param-value');
          var removePrice = this.getAttribute('data-remove-price') === 'true';

          if (removePrice) {
            // Remove price range filters
            // Price params are like: filter.v.price.gte and filter.v.price.lte
            var keysToRemove = [];
            url.searchParams.forEach(function (value, key) {
              if (key.includes('price')) {
                keysToRemove.push(key);
              }
            });
            keysToRemove.forEach(function (key) {
              url.searchParams.delete(key);
            });
          } else {
            // Remove specific filter value
            var allValues = url.searchParams.getAll(paramName);
            url.searchParams.delete(paramName);
            allValues.forEach(function (val) {
              if (val !== paramValue) {
                url.searchParams.append(paramName, val);
              }
            });
          }

          window.location.href = url.toString();
        });
      });
      return;
    }

    // ==========================================
    // CLIENT-SIDE MODE: JavaScript filtering
    // ==========================================
    if (filteringMode === 'client') {
      var sectionId = root.dataset.sectionId;
      var grid = root.querySelector('#productGrid-' + sectionId);
      var resultsCount = root.querySelector('#resultsCount-' + sectionId);
      var noResults = root.querySelector('#noResults-' + sectionId);
      var activeFiltersContainer = root.querySelector('#clientActiveFilters-' + sectionId);
      var activeFiltersList = root.querySelector('#clientActiveFiltersList-' + sectionId);
      var priceMin = root.querySelector('#clientPriceMin-' + sectionId);
      var priceMax = root.querySelector('#clientPriceMax-' + sectionId);

      var activeFilters = {
        availability: [],
        type: [],
        vendor: [],
        tag: [],
        priceMin: null,
        priceMax: null
      };

      // Checkbox filters
      root.querySelectorAll('.js-client-filter').forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
          var type = this.getAttribute('data-filter-type');
          var value = this.getAttribute('data-filter-value');

          if (this.checked) {
            if (!activeFilters[type].includes(value)) {
              activeFilters[type].push(value);
            }
          } else {
            activeFilters[type] = activeFilters[type].filter(function (v) { return v !== value; });
          }

          applyFilters();
        });
      });

      // Price filters
      var priceTimeout;
      [priceMin, priceMax].forEach(function (input) {
        if (input) {
          input.addEventListener('input', function () {
            clearTimeout(priceTimeout);
            priceTimeout = setTimeout(function () {
              activeFilters.priceMin = priceMin && priceMin.value ? parseFloat(priceMin.value) * 100 : null;
              activeFilters.priceMax = priceMax && priceMax.value ? parseFloat(priceMax.value) * 100 : null;
              applyFilters();
            }, 300);
          });
        }
      });

      function applyFilters() {
        var items = grid.querySelectorAll('.product-grid-item');
        var visibleCount = 0;
        var tags = [];

        items.forEach(function (item) {
          var show = true;

          // Availability
          if (activeFilters.availability.length > 0) {
            var available = item.dataset.available;
            if (!activeFilters.availability.includes(available)) show = false;
          }

          // Type
          if (activeFilters.type.length > 0 && show) {
            if (!activeFilters.type.includes(item.dataset.type)) show = false;
          }

          // Vendor
          if (activeFilters.vendor.length > 0 && show) {
            if (!activeFilters.vendor.includes(item.dataset.vendor)) show = false;
          }

          // Tag
          if (activeFilters.tag.length > 0 && show) {
            var itemTags = item.dataset.tags ? item.dataset.tags.split(',') : [];
            var hasTag = activeFilters.tag.some(function (t) { return itemTags.includes(t); });
            if (!hasTag) show = false;
          }

          // Price
          if ((activeFilters.priceMin !== null || activeFilters.priceMax !== null) && show) {
            var price = parseInt(item.dataset.price);
            if (activeFilters.priceMin !== null && price < activeFilters.priceMin) show = false;
            if (activeFilters.priceMax !== null && price > activeFilters.priceMax) show = false;
          }

          item.classList.toggle('is-hidden', !show);
          if (show) visibleCount++;
        });

        // Update count
        if (resultsCount) resultsCount.textContent = visibleCount;

        // No results
        if (noResults) {
          noResults.style.display = visibleCount === 0 ? 'block' : 'none';
          grid.style.display = visibleCount === 0 ? 'none' : '';
        }

        // Build active filter tags
        activeFilters.availability.forEach(function (v) {
          tags.push({ type: 'availability', value: v, label: v === 'true' ? 'In stock' : 'Sold out' });
        });
        activeFilters.type.forEach(function (v) {
          tags.push({ type: 'type', value: v, label: v });
        });
        activeFilters.vendor.forEach(function (v) {
          tags.push({ type: 'vendor', value: v, label: v });
        });
        activeFilters.tag.forEach(function (v) {
          tags.push({ type: 'tag', value: v, label: v });
        });
        if (activeFilters.priceMin !== null || activeFilters.priceMax !== null) {
          var label = '';
          if (activeFilters.priceMin !== null) label += '€' + (activeFilters.priceMin / 100);
          label += ' - ';
          if (activeFilters.priceMax !== null) label += '€' + (activeFilters.priceMax / 100);
          tags.push({ type: 'price', value: 'price', label: label });
        }

        updateUI(tags);
      }

      function updateUI(tags) {
        // Active filters display (only shown on desktop, hidden on mobile via CSS)
        if (activeFiltersContainer && activeFiltersList) {
          if (tags.length > 0) {
            activeFiltersContainer.style.display = 'flex';
            activeFiltersList.innerHTML = tags.map(function (tag) {
              return '<span class="active-filter-tag" data-type="' + tag.type + '" data-value="' + tag.value + '">' +
                '<span>' + tag.label + '</span>' +
                '<span class="active-filter-x">×</span>' +
              '</span>';
            }).join('');

            activeFiltersList.querySelectorAll('.active-filter-tag').forEach(function (tagEl) {
              tagEl.addEventListener('click', function () {
                removeFilter(tagEl.getAttribute('data-type'), tagEl.getAttribute('data-value'));
              });
            });
          } else {
            activeFiltersContainer.style.display = 'none';
          }
        }
      }

      function removeFilter(type, value) {
        if (type === 'price') {
          activeFilters.priceMin = null;
          activeFilters.priceMax = null;
          if (priceMin) priceMin.value = '';
          if (priceMax) priceMax.value = '';
        } else if (activeFilters[type]) {
          activeFilters[type] = activeFilters[type].filter(function (v) { return v !== value; });
          var checkbox = root.querySelector('.js-client-filter[data-filter-type="' + type + '"][data-filter-value="' + value + '"]');
          if (checkbox) checkbox.checked = false;
        }
        applyFilters();
      }

      function resetAllFilters() {
        activeFilters = { availability: [], type: [], vendor: [], tag: [], priceMin: null, priceMax: null };
        root.querySelectorAll('.js-client-filter').forEach(function (cb) { cb.checked = false; });
        if (priceMin) priceMin.value = '';
        if (priceMax) priceMax.value = '';
        applyFilters();
      }

      // Reset buttons
      root.querySelectorAll('.js-client-reset').forEach(function (btn) {
        btn.addEventListener('click', resetAllFilters);
      });
      root.querySelectorAll('.js-client-clear-all').forEach(function (btn) {
        btn.addEventListener('click', resetAllFilters);
      });

      // Client-side sorting
      root.querySelectorAll('.js-client-sort').forEach(function (btn) {
        btn.addEventListener('click', function () {
          root.querySelectorAll('.js-client-sort').forEach(function (b) { b.classList.remove('active'); });
          this.classList.add('active');

          var sortType = this.getAttribute('data-sort');
          var items = Array.from(grid.querySelectorAll('.product-grid-item:not(.is-hidden)'));

          items.sort(function (a, b) {
            switch (sortType) {
              case 'title-asc': return a.dataset.title.localeCompare(b.dataset.title);
              case 'title-desc': return b.dataset.title.localeCompare(a.dataset.title);
              case 'price-asc': return parseInt(a.dataset.price) - parseInt(b.dataset.price);
              case 'price-desc': return parseInt(b.dataset.price) - parseInt(a.dataset.price);
              default: return 0;
            }
          });

          items.forEach(function (item) { grid.appendChild(item); });
          sortDropdown.classList.remove('open');
          sortToggle.classList.remove('active');
        });
      });

      // Sync Judge.me ratings dynamically if loaded by Judge.me App
      function syncJudgeme() {
        root.querySelectorAll('.jdgm-widget.jdgm-preview-badge').forEach(function (badge) {
          var avg = badge.getAttribute('data-average-rating');
          var productId = badge.getAttribute('data-id');
          if (avg && productId) {
            var container = root.querySelector('.product-rating-container[data-product-id="' + productId + '"]');
            if (container) {
              var valEl = container.querySelector('.product-rating-val');
              var num = parseFloat(avg);
              if (valEl && !isNaN(num) && num > 0) {
                valEl.textContent = num.toFixed(1);
              }
            }
          }
        });
      }
      document.addEventListener('jdgm.widgetLoaded', syncJudgeme, { signal: ac.signal });
      syncJudgeme();
    }
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('.pcl-section').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (e) {
    initAll(e.target);
  });
})();
