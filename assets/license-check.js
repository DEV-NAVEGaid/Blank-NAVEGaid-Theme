// assets/license-check.js
// Runs in the Shopify theme editor only, so it never loads on a live storefront
// and has no effect on store speed or on customers.
(function () {
    // ============================================================
    // CONFIGURATION
    // ============================================================
    var API_URL = 'http://localhost:3000/api/licenses/verify';
    var THEME_ID = 'navegaid-beauty'; // must match the theme id registered on the server
  
    // Master code: always accepted without calling the server.
    // Useful while the backend is not live yet. Change or clear it before selling the theme.
    var MASTER_CODE = 'nvgd-test-lisence-2026-q1w2e3r4';
  
    // Set to true while the license server is not live yet:
    // only MASTER_CODE is accepted, every other code shows the "not valid" popup.
    // Set to false once the server is running.
    var OFFLINE_MODE = true;
  
    // Offline preview of each popup, no server or database needed.
    // Set to: 'empty' | 'invalid' | 'used' | 'revoked' | 'valid'
    // Leave empty ('') for normal use.
    var MOCK = '';
    // ============================================================
  
    var EMPTY_DELAY_MS = 5000; // delay before the "no code yet" popup appears
  
    var key = (window.NVG_LICENSE_KEY || '').trim();
    var shop = (window.Shopify && window.Shopify.shop) || '';
  
    var MESSAGES = {
      empty: {
        title: 'Activation code required',
        body: 'This theme needs an activation code. Open Theme settings \u2192 License and paste your code.',
        help: 'No code yet? Message us on Etsy with your order number and we will send it to you.'
      },
      invalid: {
        title: 'Activation code is not valid',
        body: 'The code in Theme settings \u2192 License was not recognised. Please check for typos.',
        help: 'Still not working? Message us on Etsy with your order number.'
      },
      used: {
        title: 'This code is already in use',
        body: 'This activation code is locked to a different store. Each purchase activates one store only.',
        help: 'Moving to a new store? Message us on Etsy and we will unlock it for you.'
      },
      revoked: {
        title: 'This activation code was deactivated',
        body: 'This code is no longer active for this theme.',
        help: 'If you think this is a mistake, message us on Etsy with your order number.'
      }
    };
  
    // server reason -> message shown
    var REASONS = {
      missing_key: 'empty',
      not_found: 'invalid',
      wrong_theme: 'invalid',
      invalid_shop: 'invalid',
      wrong_shop: 'used',
      revoked: 'revoked'
    };
  
    function showPopup(kind) {
      if (document.getElementById('nvg-lc-popup')) return;
      var text = MESSAGES[kind] || MESSAGES.invalid;
  
      var overlay = document.createElement('div');
      overlay.id = 'nvg-lc-popup';
      overlay.setAttribute('role', 'alertdialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;background:rgba(10,10,14,.75);' +
        'display:flex;align-items:center;justify-content:center;padding:20px;' +
        'font:16px/1.5 system-ui,-apple-system,sans-serif';
  
      var card = document.createElement('div');
      card.style.cssText =
        'max-width:420px;width:100%;background:#fff;color:#14141b;border-radius:12px;' +
        'padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:left';
  
      var title = document.createElement('h2');
      title.textContent = text.title;
      title.style.cssText = 'margin:0 0 10px;font-size:19px;line-height:1.3';
  
      var body = document.createElement('p');
      body.textContent = text.body;
      body.style.cssText = 'margin:0 0 12px';
  
      var help = document.createElement('p');
      help.textContent = text.help;
      help.style.cssText = 'margin:0;font-size:14px;color:#5b5b66';
  
      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(help);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
  
      // Intentionally not dismissible: a valid code must be entered first.
      document.documentElement.style.overflow = 'hidden';
    }
  
    function run() {
      if (MOCK) {
        if (MOCK === 'valid') return;
        if (MOCK === 'empty') setTimeout(function () { showPopup('empty'); }, EMPTY_DELAY_MS);
        else showPopup(REASONS[MOCK] || MOCK);
        return;
      }
  
      if (!key) {
        setTimeout(function () { showPopup('empty'); }, EMPTY_DELAY_MS);
        return;
      }
  
      if (MASTER_CODE && key.toLowerCase() === MASTER_CODE.toLowerCase()) return;
  
      if (OFFLINE_MODE) {
        showPopup('invalid');
        return;
      }
  
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key, shop: shop, theme: THEME_ID })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (result) {
          if (!result.valid) showPopup(REASONS[result.reason] || 'invalid');
        })
        .catch(function () {
          // Server unreachable: show nothing.
        });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();