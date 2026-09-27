/* Site settings for the static Right Price Home Buyers website.
 *
 * FORM_ENDPOINT: the web address that receives form submissions (for example a Zapier / Make
 * "catch hook" URL, or the new CRM's web-form URL). Every form POSTs one JSON object to it.
 * Leave it as an empty string while testing: submissions are then only printed to the browser
 * console and the visitor is still sent on to the next page.
 * The endpoint must accept cross-origin POSTs from this site (CORS). If it cannot answer the
 * browser's CORS "preflight" check, set FORM_SEND_AS_TEXT_PLAIN to true: the same JSON is then
 * sent with Content-Type text/plain, which browsers send without a preflight.
 *
 * SEND_STEP1_PARTIAL: the live site records a lead as soon as step 1 of the cash-offer form is
 * filled in. When true, step 1 is also POSTed on its own (form_name "offer_step1") so a seller who
 * never finishes step 2 is not lost. Step 1 and step 2 share the same lead_session_id.
 *
 * GOOGLE_MAPS_KEY: browser key for address suggestions on the property-address boxes (Google
 * Cloud project "My First Project" on contact@clehomepros.com, key "RPHB websites - address
 * autocomplete"). The key is locked in Google Cloud to rightpricehomebuyers.com and
 * teammatecle.github.io and to the Maps JavaScript / Places APIs, so it is safe in page source.
 * Empty = no suggestions; visitors type the full address as before.
 */
window.SITE_CONFIG = {
  FORM_ENDPOINT: 'https://hooks.zapier.com/hooks/catch/23924041/4dvth39/', // Zapier "Website form submissions" zap
  FORM_SEND_AS_TEXT_PLAIN: true,
  SEND_STEP1_PARTIAL: true,
  PHONE_DISPLAY: '(216) 999-6814',
  GOOGLE_MAPS_KEY: 'AIzaSyAmdJoyeJKJ8O8px9lpDruW5n-mzeop2rM'
};
