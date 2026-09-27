/* Form handling for the static Right Price Home Buyers site (replaces Gravity Forms / ReSimpli).
 * Forms are marked with data-rp-form:
 *   offer_step1  - the "Get My Fair Cash Offer" forms (home hero, page forms, pop-up). Values are kept
 *                  in sessionStorage and the visitor goes to /step-2/.
 *   offer_step2  - the /step-2/ form. Its values are merged with step 1 and POSTed, then /thank-you/.
 *   contact      - the /contact-us/ form. POSTed, then /thank-you/.
 */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[src*="assets/js/forms.js"]');
  var ROOT = new URL('../../', script.src);           // site root, wherever the site is hosted
  var STEP2_URL = new URL('step-2/', ROOT).href;
  var THANKS_URL = new URL('thank-you/', ROOT).href;
  var STORE_KEY = 'rphb_offer_step1';
  var cfg = window.SITE_CONFIG || {};

  function store(get, val) {
    try {
      if (get) return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      sessionStorage.setItem(STORE_KEY, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function uid() {
    try { return crypto.randomUUID(); } catch (e) { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function formatPhone(v) {
    var d = digits(v);
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    d = d.slice(0, 10);
    if (d.length < 4) return d.length ? '(' + d : '';
    if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }
  function validUsPhone(v) {
    var d = digits(v);
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    return d.length === 10 && /^[2-9]\d{2}[2-9]/.test(d);
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }

  // ---------- error display (Gravity Forms look for GF forms, Bootstrap look for step 2) ----------
  function clearErrors(form) {
    form.querySelectorAll('.rp-error-msg').forEach(function (n) { n.remove(); });
    form.querySelectorAll('.gfield_error').forEach(function (n) { n.classList.remove('gfield_error'); });
    form.querySelectorAll('.has-error').forEach(function (n) { n.classList.remove('has-error'); });
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (n) { n.setAttribute('aria-invalid', 'false'); });
  }
  function showError(input, msg) {
    input.setAttribute('aria-invalid', 'true');
    var holder = input.closest('.gfield') || input.closest('.form-group') || input.parentNode;
    holder.classList.add(holder.classList.contains('gfield') ? 'gfield_error' : 'has-error');
    var div = document.createElement('div');
    div.className = 'rp-error-msg gfield_description validation_message gfield_validation_message help-block';
    div.setAttribute('role', 'alert');
    div.textContent = msg;
    (input.closest('.ginput_container, .ginput_full, .form-group') || holder).appendChild(div);
  }
  function formMessage(form, msg) {
    var box = form.querySelector('.rp-form-message');
    if (!box) {
      box = document.createElement('div');
      box.className = 'rp-form-message';
      box.setAttribute('role', 'alert');
      form.insertBefore(box, form.firstChild);
    }
    box.innerHTML = msg;
  }

  function validate(form) {
    clearErrors(form);
    var first = null;
    function fail(input, msg) { showError(input, msg); if (!first) first = input; }
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (el.type === 'hidden' || el.disabled || el.hasAttribute('data-honeypot')) return;
      var v = (el.value || '').trim();
      if (el.required && !v) return fail(el, 'This field is required.');
      if (v && el.type === 'email' && !validEmail(v)) return fail(el, 'Please enter a valid email address.');
      if (v && el.hasAttribute('data-us-phone') && !validUsPhone(v)) return fail(el, 'Please enter a valid 10-digit US phone number, e.g. (216) 555-0123.');
    });
    if (first) { first.focus(); return false; }
    return true;
  }

  function collect(form) {
    var data = {};
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (!el.name || el.hasAttribute('data-honeypot') || el.type === 'submit') return;
      if (el.type === 'checkbox') {
        if (el.name === 'consent') {
          data.consent = el.checked;
          var lab = form.querySelector('label[for="' + el.id + '"]');
          data.consent_text = lab ? lab.textContent.replace(/\s+/g, ' ').trim() : '';
        } else if (el.checked) { data[el.name] = el.value; }
        return;
      }
      var v = (el.value || '').trim();
      if (el.hasAttribute('data-us-phone') && v) v = formatPhone(v);
      data[el.name] = v;
    });
    return data;
  }

  function isSpam(form) {
    var hp = form.querySelector('[data-honeypot]');
    return !!(hp && hp.value);
  }

  function post(payload) {
    var endpoint = (cfg.FORM_ENDPOINT || '').trim();
    if (!endpoint) {
      console.log('[forms] SITE_CONFIG.FORM_ENDPOINT is empty - submission not sent:', payload);
      return Promise.resolve(true);
    }
    // One readable block of every field, used as the body of the notification email.
    payload.summary = Object.keys(payload).filter(function (k) { return k !== 'summary'; }).map(function (k) {
      var v = payload[k];
      return k + ': ' + (Array.isArray(v) ? v.join(', ') : (v == null ? '' : v));
    }).join('\n');
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': cfg.FORM_SEND_AS_TEXT_PLAIN ? 'text/plain;charset=UTF-8' : 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return true;
    });
  }

  function basePayload(formName) {
    return {
      form_name: formName,
      page_url: location.href,
      referrer: document.referrer || '',
      submitted_at: new Date().toISOString(),
      source: 'rightpricehomebuyers.com'
    };
  }

  function setBusy(form, busy) {
    form.querySelectorAll('[type="submit"]').forEach(function (b) {
      b.disabled = busy;
      if (b.tagName === 'INPUT') {
        if (busy) { b.dataset.label = b.value; b.value = 'Sending...'; } else if (b.dataset.label) { b.value = b.dataset.label; }
      } else {
        if (busy) { b.dataset.label = b.textContent; b.textContent = 'Sending...'; } else if (b.dataset.label) { b.textContent = b.dataset.label; }
      }
    });
  }

  function failMessage(form) {
    setBusy(form, false);
    var phone = cfg.PHONE_DISPLAY || '(216) 999-6814';
    formMessage(form, 'Sorry, something went wrong sending your information. Please try again, or call us at <a href="tel:' + digits(phone) + '">' + phone + '</a>.');
  }

  function handleSubmit(e) {
    var form = e.currentTarget;
    e.preventDefault();
    if (isSpam(form)) { location.href = THANKS_URL; return; }
    if (!validate(form)) return;
    var kind = form.getAttribute('data-rp-form');
    var fields = collect(form);
    setBusy(form, true);

    if (kind === 'offer_step1') {
      var step1 = { lead_session_id: uid(), fields: fields, page_url: location.href, submitted_at: new Date().toISOString() };
      store(false, step1);
      var go = function () { location.href = STEP2_URL; };
      if (cfg.SEND_STEP1_PARTIAL) {
        var p = basePayload('offer_step1');
        p.lead_session_id = step1.lead_session_id;
        Object.assign(p, fields);
        post(p).catch(function (err) { console.warn('[forms] step 1 send failed', err); }).then(go);
      } else { go(); }
      return;
    }

    var payload = basePayload(kind === 'offer_step2' ? 'offer_step2_complete' : kind);
    if (kind === 'offer_step2') {
      var s1 = store(true) || { fields: {} };
      payload.lead_session_id = s1.lead_session_id || uid();
      payload.step1_page_url = s1.page_url || '';
      Object.assign(payload, s1.fields || {}, fields);   // step 2 edits win
    } else {
      Object.assign(payload, fields);
    }
    post(payload).then(function () {
      if (kind === 'offer_step2') { try { sessionStorage.removeItem(STORE_KEY); } catch (err) {} }
      location.href = THANKS_URL;
    }).catch(function (err) {
      console.error('[forms] submission failed', err);
      failMessage(form);
    });
  }

  function prefillStep2(form) {
    var s1 = store(true);
    var f = (s1 && s1.fields) || {};
    ['property_address', 'city', 'state', 'zip', 'full_name', 'email', 'phone'].forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el) return;
      if (f[name]) el.value = f[name];
      if (el.hasAttribute('data-readonly-if-filled') && el.value) el.readOnly = true;
    });
  }

  // ---------- address autocomplete (Google Places API (New)); off while GOOGLE_MAPS_KEY is empty ----------
  // Replaces the Gravity Forms geolocation add-on the live site ran on ReSimpli's Google key: suggests
  // addresses as the seller types, then fills the city / state / ZIP fields of the same form.
  var places = null;       // google.maps.places once loaded
  var mapsLoading = null;

  function loadPlaces() {
    if (places) return Promise.resolve(places);
    if (mapsLoading) return mapsLoading;
    mapsLoading = new Promise(function (resolve, reject) {
      window.__rpMapsReady = function () {
        google.maps.importLibrary('places').then(function (lib) { places = lib; resolve(lib); }, reject);
      };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(cfg.GOOGLE_MAPS_KEY) +
        '&v=weekly&loading=async&callback=__rpMapsReady';
      s.async = true;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return mapsLoading;
  }

  function fillAddressParts(form, place) {
    var parts = {};
    (place.addressComponents || []).forEach(function (c) {
      c.types.forEach(function (t) { parts[t] = c; });
    });
    var city = parts.locality || parts.sublocality || parts.postal_town || parts.administrative_area_level_3;
    var set = function (name, value) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el || !value || el.readOnly) return;
      if (el.tagName === 'SELECT') {
        var opt = Array.prototype.find.call(el.options, function (o) { return o.value === value; });
        if (opt) el.value = value;
      } else { el.value = value; }
    };
    set('city', city && city.longText);
    var st = parts.administrative_area_level_1;
    if (st) set('state', form.querySelector('select[name="state"]') ? st.longText : st.shortText);
    set('zip', parts.postal_code && parts.postal_code.longText);
  }

  function attachAutocomplete(input) {
    var form = input.form;
    var holder = input.parentNode;
    if (getComputedStyle(holder).position === 'static') holder.style.position = 'relative';
    var list = document.createElement('div');
    list.className = 'rp-ac-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    holder.appendChild(list);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('autocomplete', 'off');   // stop the browser's own suggestions covering ours

    var token = null, timer = null, items = [], active = -1, seq = 0;
    function close() { list.hidden = true; list.innerHTML = ''; items = []; active = -1; }
    function highlight(i) {
      active = i;
      Array.prototype.forEach.call(list.querySelectorAll('.rp-ac-item'), function (n, k) {
        n.classList.toggle('is-active', k === i);
      });
    }
    function choose(i) {
      var pred = items[i];
      close();
      if (!pred) return;
      input.value = pred.text.toString().replace(/, USA$/, '');
      var place = pred.toPlace();
      place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] }).then(function () {
        if (place.formattedAddress) input.value = place.formattedAddress.replace(/, USA$/, '');
        fillAddressParts(form, place);
      }).catch(function (err) { console.warn('[address] details failed', err); });
      token = null;   // a finished lookup ends the billing session
    }
    function render(suggestions) {
      list.innerHTML = '';
      items = suggestions.map(function (s) { return s.placePrediction; }).filter(Boolean);
      if (!items.length) { close(); return; }
      items.forEach(function (p, i) {
        var row = document.createElement('div');
        row.className = 'rp-ac-item';
        row.setAttribute('role', 'option');
        row.textContent = p.text.toString().replace(/, USA$/, '');
        row.addEventListener('mousedown', function (e) { e.preventDefault(); choose(i); });
        list.appendChild(row);
      });
      var credit = document.createElement('div');
      credit.className = 'rp-ac-credit';
      credit.textContent = 'Powered by Google';
      list.appendChild(credit);
      list.hidden = false;
      active = -1;
    }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (input.readOnly || q.length < 4) { close(); return; }
      timer = setTimeout(function () {
        var mine = ++seq;
        loadPlaces().then(function (lib) {
          if (!token) token = new lib.AutocompleteSessionToken();
          return lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            sessionToken: token,
            includedRegionCodes: ['us'],
            locationBias: { center: { lat: 41.4993, lng: -81.6944 }, radius: 50000 }   // Cleveland first
          });
        }).then(function (res) {
          if (mine === seq) render(res.suggestions || []);
        }).catch(function (err) { console.warn('[address] suggestions failed', err); close(); });
      }, 250);
    });
    input.addEventListener('keydown', function (e) {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { close(); }
    });
    input.addEventListener('blur', function () { setTimeout(close, 150); });
  }

  function init() {
    if ((cfg.GOOGLE_MAPS_KEY || '').trim()) {
      document.querySelectorAll('form[data-rp-form] input[name="property_address"]').forEach(attachAutocomplete);
    }
    document.querySelectorAll('form[data-rp-form]').forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
      form.querySelectorAll('[data-us-phone]').forEach(function (el) {
        el.addEventListener('input', function () {
          var atEnd = el.selectionStart === el.value.length;
          var f = formatPhone(el.value);
          if (f !== el.value && atEnd) el.value = f;
        });
        el.addEventListener('blur', function () { if (el.value) el.value = formatPhone(el.value); });
      });
      if (form.getAttribute('data-rp-form') === 'offer_step2') prefillStep2(form);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
