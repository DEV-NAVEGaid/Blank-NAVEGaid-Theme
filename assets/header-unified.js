document.addEventListener('DOMContentLoaded', function() {
    /* === DESKTOP: Hover dropdowns === */
    var navItems = document.querySelectorAll('.nvgd-nav-item[data-dropdown]');
    var backdrop = document.getElementById('nvgdDropdownBackdrop');
    var header = document.querySelector('.nvgd-header');
    var closeTimeout = null;
    var hoverDelay = 50;

    function updateDropdownPositions() {
        if (!header) return;
        var headerRect = header.getBoundingClientRect();
        document.querySelectorAll('.nvgd-dropdown.level0.submenu').forEach(function(d) {
            d.style.top = headerRect.bottom + 'px';
        });
    }

    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() { updateDropdownPositions(); ticking = false; });
            ticking = true;
        }
    }, { passive: true });
    window.addEventListener('resize', updateDropdownPositions, { passive: true });
    setTimeout(updateDropdownPositions, 100);

    function closeAllDropdowns() {
        navItems.forEach(function(i) { i.classList.remove('nvgd-active'); });
        if (backdrop) backdrop.classList.remove('nvgd-active');
    }

    function openDropdown(item) {
        if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
        updateDropdownPositions();
        navItems.forEach(function(o) { if (o !== item) o.classList.remove('nvgd-active'); });
        item.classList.add('nvgd-active');
        if (backdrop) backdrop.classList.add('nvgd-active');
    }

    function scheduleClose() {
        if (closeTimeout) clearTimeout(closeTimeout);
        closeTimeout = setTimeout(closeAllDropdowns, hoverDelay);
    }

    function cancelClose() {
        if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
    }

    navItems.forEach(function(item) {
        var dropdown = item.querySelector('.nvgd-dropdown.level0.submenu');
        item.addEventListener('mouseenter', function() { openDropdown(item); });
        item.addEventListener('mouseleave', function(e) {
            if (dropdown && dropdown.contains(e.relatedTarget)) return;
            scheduleClose();
        });
        if (dropdown) {
            dropdown.addEventListener('mouseenter', cancelClose);
            dropdown.addEventListener('mouseleave', function(e) {
                if (item.contains(e.relatedTarget)) return;
                scheduleClose();
            });
        }
        var link = item.querySelector('a');
        if (link) {
            link.addEventListener('click', function(e) {
                var href = e.currentTarget.getAttribute('href');
                if (href && href !== '#' && href !== '') return;
                e.preventDefault();
            });
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nvgd-nav-item') && !e.target.closest('.nvgd-dropdown')) closeAllDropdowns();
    });
    if (backdrop) {
        backdrop.addEventListener('click', closeAllDropdowns);
        backdrop.addEventListener('mouseenter', scheduleClose);
    }

    /* === MOBILE: Move overlay + drawer to body === */
    var mobileDrawer = document.getElementById('mobileDrawer');
    var mobileOverlay = document.getElementById('mobileDrawerOverlay');
    if (mobileOverlay) document.body.appendChild(mobileOverlay);
    if (mobileDrawer) document.body.appendChild(mobileDrawer);

    /* === MOBILE: Announcement bar offset === */
    function updateDrawerTop() {
        var announcementBar = document.querySelector('.shopify-section-announcement-bar, [class*="announcement"], .announcement-bar');
        var offset = 0;
        if (announcementBar) {
            var rect = announcementBar.getBoundingClientRect();
            if (rect.bottom > 0) {
                offset = rect.bottom;
            }
        }
        document.documentElement.style.setProperty('--mobile-drawer-top', offset + 'px');
    }
    updateDrawerTop();

    /* === MOBILE: Drawer open/close === */
    var mobileToggle = document.getElementById('mobileDrawerToggle');
    var mobileClose = document.getElementById('mobileDrawerClose');
    var mobileDrawerOpen = false;

    function openMobileDrawer() {
        mobileDrawerOpen = true;
        updateDrawerTop();
        if (mobileDrawer) mobileDrawer.classList.add('is-open');
        if (mobileOverlay) mobileOverlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        window.addEventListener('scroll', updateDrawerTop, { passive: true });
    }
    function closeMobileDrawer() {
        mobileDrawerOpen = false;
        if (mobileDrawer) mobileDrawer.classList.remove('is-open');
        if (mobileOverlay) mobileOverlay.classList.remove('is-open');
        document.body.style.overflow = '';
        window.removeEventListener('scroll', updateDrawerTop);
        var sb = document.getElementById('mobileDrawerSearch');
        var si = document.getElementById('mobileDrawerSearchInput');
        var sc = document.getElementById('mobileDrawerSearchClear');
        if (sb) sb.classList.remove('is-open');
        if (si) si.value = '';
        if (sc) sc.classList.remove('is-visible');
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMobileDrawer();
        });
    }
    if (mobileClose) {
        mobileClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMobileDrawer();
        });
    }
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMobileDrawer();
        });
    }
    document.addEventListener('click', function(e) {
        if (!mobileDrawerOpen) return;
        if (mobileDrawer && mobileDrawer.contains(e.target)) return;
        if (mobileToggle && mobileToggle.contains(e.target)) return;
        closeMobileDrawer();
    }, true);
    document.addEventListener('touchstart', function(e) {
        if (!mobileDrawerOpen) return;
        if (mobileDrawer && mobileDrawer.contains(e.target)) return;
        if (mobileToggle && mobileToggle.contains(e.target)) return;
        closeMobileDrawer();
    }, true);

    /* === MOBILE: Card accordion === */
    var cardTriggers = document.querySelectorAll('[data-mobile-card-trigger]');
    cardTriggers.forEach(function(card) {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            var isOpen = card.classList.contains('is-open');
            cardTriggers.forEach(function(c) { c.classList.remove('is-open'); });
            if (!isOpen) card.classList.add('is-open');
        });
    });

    /* === MOBILE: Inline search bar === */
    var searchToggle = document.getElementById('mobileDrawerSearchToggle');
    var searchBar = document.getElementById('mobileDrawerSearch');
    var searchInput = document.getElementById('mobileDrawerSearchInput');
    var searchClear = document.getElementById('mobileDrawerSearchClear');

    function closeMobileSearch() {
        if (searchBar) searchBar.classList.remove('is-open');
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.remove('is-visible');
    }

    if (searchToggle) {
        searchToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (searchBar) {
                var isOpen = searchBar.classList.contains('is-open');
                if (isOpen) {
                    closeMobileSearch();
                } else {
                    searchBar.classList.add('is-open');
                    setTimeout(function() {
                        if (searchInput) searchInput.focus();
                    }, 300);
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (searchClear) {
                searchClear.classList.toggle('is-visible', searchInput.value.length > 0);
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function(e) {
            e.preventDefault();
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            searchClear.classList.remove('is-visible');
        });
    }

    /* === ESC key === */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileSearch();
            closeMobileDrawer();
            closeAllDropdowns();
        }
    });
});
