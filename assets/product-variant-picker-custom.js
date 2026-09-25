    if (!customElements.get('nvgd-variant-picker')) {
      class NvgdVariantPicker extends HTMLElement {
        constructor() {
          super();
          this.variantData = null;
          this.currentVariant = null;
          this.addEventListener('change', this.onVariantChange.bind(this));
          this.updateCurrentVariant();
        }

        onVariantChange(event) {
          var target = event.target;

          // Only react to our variant inputs (radio or select)
          var isVariantInput = target.classList.contains('nvgd-variant-input') ||
                               target.classList.contains('nvgd-variant-select') ||
                               target.classList.contains('nvgd-pill-input');
          if (!isVariantInput) return;

          var selectedValue = target.value;
          var pickerType = target.dataset.pickerType || 'button';

          // Update card visual state
          if (pickerType === 'card') {
            var wrapper = target.closest('.nvgd-variant-option-wrapper');
            if (wrapper) {
              wrapper.querySelectorAll('.nvgd-variant-card').forEach(function(card) {
                card.classList.remove('nvgd-variant-card--selected');
              });
              var selectedCard = target.closest('.nvgd-variant-card');
              if (selectedCard) selectedCard.classList.add('nvgd-variant-card--selected');
            }
          }

          // Update header "selected" text
          var optionWrapper = target.closest('.nvgd-variant-option-wrapper');
          if (optionWrapper) {
            var selectedValueEl = optionWrapper.querySelector('[data-selected-value]');
            if (selectedValueEl) selectedValueEl.textContent = selectedValue;
          }

          // Find matching variant
          this.updateCurrentVariant();

          if (!this.currentVariant) {
            if (this.publishOptionValueSelection(event, target, pickerType)) return;
            this.setUnavailable();
            return;
          }

          this.updateMedia();
          this.updatePickupAvailability();
          if (this.publishOptionValueSelection(event, target, pickerType)) return;

          // Fallback for contexts without product-info.
          this.updateFormInput();
          this.updateURL();
          this.renderProductInfo();

        }
        getSelectedOptions() {
          var options = [];
          this.querySelectorAll('.nvgd-variant-option-wrapper').forEach(function(wrapper) {
            var pickerType = wrapper.dataset.pickerType;
            if (pickerType === 'dropdown') {
              var select = wrapper.querySelector('select');
              if (select) options.push(select.value);
            } else {
              // Radio-based (card or pill)
              var checked = wrapper.querySelector('input[type="radio"]:checked');
              if (checked) options.push(checked.value);
            }
          });
          return options;
        }
        getSelectedOptionValueIds() {
          var selectedOptionValues = [];
          this.querySelectorAll('.nvgd-variant-option-wrapper').forEach(function(wrapper) {
            var pickerType = wrapper.dataset.pickerType;
            var selected;
            if (pickerType === 'dropdown') {
              var select = wrapper.querySelector('select');
              selected = select && select.selectedOptions[0];
            } else {
              selected = wrapper.querySelector('input[type="radio"]:checked');
            }
            if (selected && selected.dataset.optionValueId) {
              selectedOptionValues.push(selected.dataset.optionValueId);
            }
          });
          return selectedOptionValues;
        }

        publishOptionValueSelection(event, target, pickerType) {
          if (!this.closest('product-info') || typeof publish !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') {
            return false;
          }

          var selectionTarget = pickerType === 'dropdown'
            ? target.selectedOptions[0] || target
            : target;
          publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
            data: {
              event: event,
              target: selectionTarget,
              selectedOptionValues: this.getSelectedOptionValueIds(),
            },
          });
          return true;
        }

        getVariantData() {
          if (!this.variantData) {
            var jsonEl = this.querySelector('[data-variant-data]');
            if (jsonEl) this.variantData = JSON.parse(jsonEl.textContent);
          }
          return this.variantData || [];
        }

        updateCurrentVariant() {
          var selectedOptions = this.getSelectedOptions();
          this.currentVariant = this.getVariantData().find(function(variant) {
            return variant.options.every(function(option, index) {
              return selectedOptions[index] === option;
            });
          }) || null;
        }

        updateFormInput() {
          if (!this.currentVariant) return;
          var sectionId = this.dataset.section;
          var self = this;
          document.querySelectorAll(
            '#product-form-' + sectionId + ', #product-form-installment-' + sectionId
          ).forEach(function(form) {
            var input = form.querySelector('input[name="id"]');
            if (input) {
              input.value = self.currentVariant.id;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }

        updateURL() {
          if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
          window.history.replaceState({}, '', this.dataset.url + '?variant=' + this.currentVariant.id);
        }

        updateMedia() {
          if (!this.currentVariant) return;
          var featuredImage = this.currentVariant.featured_image;
          if (!featuredImage || !featuredImage.src) return;

          function getFilename(url) {
            if (!url) return '';
            return url.split('?')[0].split('/').pop();
          }

          var targetFilename = getFilename(featuredImage.src);
          if (!targetFilename) return;

          // Try custom gallery first
          var container = document.querySelector('.nvgd-main-gallery-container');
          if (container) {
            var allSlides = container.querySelectorAll('.nvgd-media-image');
            var targetSlide = null;
            allSlides.forEach(function(slide) {
              if (targetSlide) return;
              var img = slide.querySelector('img');
              if (!img) return;
              if (getFilename(img.src) === targetFilename ||
                  (img.srcset && img.srcset.indexOf(targetFilename) !== -1)) {
                targetSlide = slide;
              }
            });
            if (targetSlide && targetSlide !== container.firstElementChild) {
              container.insertBefore(targetSlide, container.firstElementChild);
              container.querySelectorAll('.nvgd-media-image').forEach(function(el, i) {
                el.dataset.mediaIndex = String(i);
              });
              if (window.innerWidth <= 768) {
                container.scrollTo({ left: 0, behavior: 'instant' });
                document.querySelectorAll('.nvgd-slider-dot').forEach(function(dot, i) {
                  dot.classList.toggle('active', i === 0);
                });
              } else {
                var thumbnailList = document.querySelector('.nvgd-media-thumbnail ul');
                if (thumbnailList) {
                  var matchingThumb = null;
                  var thumbs = thumbnailList.querySelectorAll('.nvgd-thumbnail-item');
                  thumbs.forEach(function(t) {
                    t.classList.remove('active');
                    var thumbImg = t.querySelector('img');
                    if (thumbImg && getFilename(thumbImg.src) === targetFilename) matchingThumb = t;
                  });
                  if (matchingThumb) {
                    thumbnailList.insertBefore(matchingThumb, thumbnailList.firstElementChild);
                    matchingThumb.classList.add('active');
                  }
                  thumbnailList.querySelectorAll('.nvgd-thumbnail-item').forEach(function(t, i) {
                    t.dataset.index = String(i);
                  });
                }
              }
            }
            return;
          }

          // Fallback: Dawn's standard gallery
          var mediaGallery = document.querySelector('[id^="MediaGallery-"]');
          if (mediaGallery && typeof mediaGallery.setActiveMedia === 'function') {
            if (this.currentVariant.featured_media) {
              mediaGallery.setActiveMedia(
                this.currentVariant.featured_media.id.toString(),
                true
              );
            }
          }
        }

        updatePickupAvailability() {
          var pickup = document.querySelector('pickup-availability');
          if (!pickup) return;
          if (this.currentVariant && this.currentVariant.available) {
            pickup.fetchAvailability(this.currentVariant.id);
          } else {
            pickup.removeAttribute('available');
            pickup.innerHTML = '';
          }
        }

        renderProductInfo() {
          var self = this;
          var requestedVariantId = this.currentVariant.id;
          var sectionId = this.dataset.originalSection || this.dataset.section;

          fetch(this.dataset.url + '?variant=' + requestedVariantId + '&section_id=' + sectionId)
            .then(function(response) { return response.text(); })
            .then(function(responseText) {
              if (!self.currentVariant || self.currentVariant.id !== requestedVariantId) return;
              var html = new DOMParser().parseFromString(responseText, 'text/html');

              var priceSource = html.getElementById('price-' + sectionId);
              var priceDest = document.getElementById('price-' + self.dataset.section);
              if (priceSource && priceDest) {
                priceDest.innerHTML = priceSource.innerHTML;
                priceDest.classList.remove('visibility-hidden');
              }

              var skuSource = html.getElementById('Sku-' + sectionId);
              var skuDest = document.getElementById('Sku-' + self.dataset.section);
              if (skuSource && skuDest) {
                skuDest.innerHTML = skuSource.innerHTML;
                skuDest.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
              }

              var invSource = html.getElementById('Inventory-' + sectionId);
              var invDest = document.getElementById('Inventory-' + self.dataset.section);
              if (invSource && invDest) {
                invDest.innerHTML = invSource.innerHTML;
                invDest.classList.toggle('visibility-hidden', invSource.innerText === '');
              }

              var addButtonUpdated = html.getElementById('ProductSubmitButton-' + sectionId);
              self.toggleAddButton(
                addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
                self.currentVariant.available ? '' : (window.variantStrings ? window.variantStrings.soldOut : 'Sold out')
              );

              if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
                publish(PUB_SUB_EVENTS.variantChange, {
                  data: {
                    sectionId: sectionId,
                    html: html,
                    variant: self.currentVariant,
                  },
                });
              }
            });
        }

        toggleAddButton(disable, text) {
          var form = document.getElementById('product-form-' + this.dataset.section);
          if (!form) return;
          var btn = form.querySelector('[name="add"]');
          var btnText = form.querySelector('[name="add"] > span');
          if (!btn) return;
          if (disable) {
            btn.setAttribute('disabled', 'disabled');
            if (text && btnText) btnText.textContent = text;
          } else {
            btn.removeAttribute('disabled');
            if (btnText) btnText.textContent = window.variantStrings ? window.variantStrings.addToCart : 'Add to cart';
          }
        }

        setUnavailable() {
          var form = document.getElementById('product-form-' + this.dataset.section);
          if (!form) return;
          var btnText = form.querySelector('[name="add"] > span');
          if (btnText) btnText.textContent = window.variantStrings ? window.variantStrings.unavailable : 'Unavailable';
          var btn = form.querySelector('[name="add"]');
          if (btn) btn.setAttribute('disabled', 'disabled');
          var price = document.getElementById('price-' + this.dataset.section);
          if (price) price.classList.add('visibility-hidden');
        }
      }

      customElements.define('nvgd-variant-picker', NvgdVariantPicker);
    }
