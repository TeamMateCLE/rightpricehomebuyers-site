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

  function init() {
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
