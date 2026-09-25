                  document.addEventListener('DOMContentLoaded', function() {
                    const navigateLinks = document.querySelectorAll('.accordion-navigate');

                    navigateLinks.forEach(link => {
                      link.addEventListener('click', function(e) {
                        e.preventDefault();

                        const sectionName = this.getAttribute('data-section-name');

                        // Find the section by searching for the section name in the ID
                        const targetSection = document.querySelector(`[id*="${sectionName}"]`);

                        if (targetSection) {
                          // Smooth scroll to target
                          targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });

                          // Update URL with clean anchor (not the full Shopify ID)
                          history.pushState(null, null, '#' + sectionName);
                        } else {
                          console.warn('Section not found:', sectionName);
                        }
                      });
                    });

                    // Handle direct URL navigation (when page loads with #faq)
                    function scrollToSectionOnLoad() {
                      const hash = window.location.hash.substring(1); // Remove the #

                      if (hash) {
                        const targetSection = document.querySelector(`[id*="${hash}"]`);

                        if (targetSection) {
                          setTimeout(() => {
                            targetSection.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }, 100);
                        }
                      }
                    }

                    scrollToSectionOnLoad();
                  });
