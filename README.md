# rightpricehomebuyers.com: static copy

This is a self-contained static copy of the seller website https://www.rightpricehomebuyers.com, built on 2026-09-23 from the live pages. The live site is hosted by ReSimpli (WordPress). This copy uses plain HTML, CSS and JS, has no build step, and runs on any static host (Netlify, Cloudflare Pages, GitHub Pages, S3 or plain Apache/Nginx).

- Every page is `folder/index.html` at the same path as the live site, so old links and Google results keep working.
- All links and asset references are relative, so the site works from any host root or sub-folder.
- Every logo, image, font, icon font and stylesheet is stored in `assets/`. No file references `resimpliwebsites.com` or `rightpricehomebuyers.com/wp-content`. The "Powered by REsimpli" footer credit is removed.
- To preview it locally, run `npx --yes http-server . -p 8081 -s` in this folder and open http://localhost:8081/.

## Before go-live: the one required setting

Open `assets/js/config.js` and paste the web address that should receive form submissions into `FORM_ENDPOINT`. That address could be a Zapier/Make catch hook or the new CRM's web-form URL. **While it is empty, no lead is sent anywhere.** Each submission is only printed to the browser console, and the visitor still moves on to the next page.

- The endpoint must accept cross-origin POSTs (CORS). If it rejects the browser's preflight check, set `FORM_SEND_AS_TEXT_PLAIN: true`. The same JSON is then sent as `text/plain`, which needs no preflight.
- The `og:image`, `twitter:image` and JSON-LD image URLs are absolute (`https://www.rightpricehomebuyers.com/assets/img/...`), because social networks require absolute image URLs. They only resolve once this copy is live on that domain.

## Pages built (14)

| Path | Page |
|---|---|
| `/` | Home: hero form, How We Work, Our Advantage, About, Get Fair Cash Deal form, Our Process, testimonial carousel |
| `/compare/` | Agent vs. Right Price Home Buyers comparison table |
| `/testimonials/` | Testimonials |
| `/faq/` | FAQ accordion (one answer open at a time, same as live) |
| `/about/` | About, with a carousel and a form |
| `/contact-us/` | Contact form, address/email/phone and Google map |
| `/step-2/` | Step 2 of the cash-offer form |
| `/thank-you/` | Thank-you page |
| `/privacy-policy/` | Privacy policy, word for word, including the SMS consent, HELP/STOP and opt-out wording |
| `/terms-of-use/` | Terms of use, word for word |
| `/blog/` | Blog index (2 posts) |
| `/what-are-the-benefits-of-selling-a-house-for-cash-in-city/` | Blog post |
| `/how-to-sell-your-house-without-an-agent-in-city/` | Blog post |
| `/city/cleveland/` | Cleveland city page |

`/sample-page/` was skipped as instructed.

Every page keeps the live `<title>`, meta description, canonical (`https://www.rightpricehomebuyers.com/...`), robots tag, Open Graph and Twitter tags, the Yoast JSON-LD schema and the fox-logo favicons (32, 192, 180 apple-touch, full size).

### Text changes versus the live site

A word-by-word comparison of every page against the live page found no differences other than the ones listed here.

1. The "Powered by REsimpli." footer credit is removed on all pages.
2. The unfilled "City" placeholder is replaced with "Cleveland" in both blog post titles. This applies to the `<title>`, headings, Open Graph and schema, and the blog index. The URL slugs still end in `-in-city` so old links keep working.
3. Some auto-generated meta and Open Graph descriptions rendered the placeholder as an empty gap, for example "sell your house in , you're" and "SERVICE OF . (“”) ... BETWEEN YOU AND ,". These gaps are filled with the same words the page body already uses: "Cleveland" in the blog posts and "Right Price Home Buyers" in the Terms. The Terms **page body** was already complete and is unchanged.

## Forms

All forms keep the live Gravity Forms markup and classes, so they look identical. The Gravity Forms and ReSimpli code behind them is replaced by `assets/js/forms.js`, which does the following:

- Checks client-side that required fields are filled.
- Validates email format.
- Checks for a US phone number of 10 digits (an optional leading 1 is allowed) and formats it as `(216) 555-0123` as the visitor types.
- Includes a hidden honeypot field. If a bot fills it, nothing is sent and the bot is sent to the thank-you page.
- Shows an error with the phone number if the endpoint fails. The visitor is not redirected in that case.

Every POST body is one JSON object containing the fields below plus `form_name`, `page_url`, `referrer`, `submitted_at` (ISO time) and `source: "rightpricehomebuyers.com"`.

### 1. Cash-offer step 1 (`form_name: "offer_step1"`)

This form appears in four places:

- The home-page hero (live Gravity Form 1).
- The home and city page "Get Fair Cash Deal" forms (Form 4).
- The forms on inner pages (Form 5).
- The "Get Fair Cash Offer" pop-up opened by every "Get Offer Now" button (Form 3).

| Field (JSON name) | Label / placeholder | Required |
|---|---|---|
| `property_address` | Property Address, "Address (Required)" | yes |
| `address_line_2`, `city`, `state` (dropdown of US states), `zip`, `country` (always "United States") | Hidden sub-fields, exactly as on live | no |
| `full_name` | Full Name, "Name (Required)" | yes |
| `email` | Email, "Email (Required)" | yes |
| `phone` | Phone, "Phone (Required)" | yes |
| `consent` (true/false) + `consent_text` | Privacy Policy checkbox (text below) | no. It is optional on live too. |
| `wp_page_id` | Hidden. It holds the old WordPress page id, which says which page the lead came from (4 = home). | no |

Submit button: "Get My Fair Cash Offer Now >>".

Consent checkbox text, verbatim from live and identical on every form:

> I agree to the Terms & Conditions and Privacy Policy By submitting this form, you consent to receive SMS messages and/or calls and/or emails from Right Price Home Buyers. Message frequency varies. To unsubscribe. follow the instructions provided in our communications. Msg & data rates may apply for SMS. Your information is secure and will not be sold to third parties. Text HELP for HELP. text STOP to cancel.

In the form, "Terms & Conditions" and "Privacy Policy" link to `/terms-of-use/` and `/privacy-policy/`.

**How step 1 behaves:** the values are saved in the browser's sessionStorage and the visitor goes to `/step-2/`. The live site records the lead as soon as step 2 opens. To match that, step 1 is also POSTed on its own as `offer_step1`, so a seller who never finishes step 2 is still captured. Set `SEND_STEP1_PARTIAL: false` in `config.js` to turn this off. Step 1 and step 2 share a `lead_session_id`, so the receiving side can match or de-duplicate them.

### 2. Cash-offer step 2 (`/step-2/`, `form_name: "offer_step2_complete"`)

| Field | Label | Required |
|---|---|---|
| `property_address` | Property address | yes |
| `city` | City | no |
| `state` | State | no |
| `zip` | Zip | no |
| `full_name` | Full name | yes |
| `email` | Email | yes |
| `phone` | Phone number | no. It is optional on live. |

Submit button: "Get Offer Now". The form is pre-filled from step 1. Address fields that arrive filled are read-only, as on live. The POST merges the step 1 fields (including `consent` and `consent_text`) with the step 2 fields, adds `lead_session_id` and `step1_page_url`, and then sends the visitor to `/thank-you/`.

### 3. Contact form (`/contact-us/`, `form_name: "contact"`)

This form has the same fields as step 1, plus `message` (textarea, "Message...", optional). Submit button: "Send Message". After sending, the visitor goes to `/thank-you/`.

## Live content that could not be reproduced, and why

- **Address autocomplete.** On live, the property-address box uses Google Places (Gravity Forms Geolocation add-on with a ReSimpli Google Maps key) to fill the hidden city, state and zip fields. That needs a Google API key tied to ReSimpli, so it is not included. Visitors type the full address in one box. City, state and zip stay blank on step 1 and can be typed on step 2.
- **ReSimpli lead plumbing.** This covers the step-2 background call that created the ReSimpli lead, the visited-pages tracking, the ReSimpli referrer field and the "ReSimpli Analytics" beacon. Submissions now go only to `FORM_ENDPOINT`.
- **Hidden ReSimpli questions on step 2.** The live step-2 page source contains hidden ReSimpli custom questions that visitors never see: Urgency, motivation, Ball Park Price, Condition and the internal TC contract checklist items. They were not copied. Note: the live page currently exposes those internal question names in its source code.
- **Images that are already broken on live.** Eleven decorative theme images referenced by old stylesheets return errors on the live server as well: slider arrow PNGs, `testimonial_bg.jpg`, `newtab.png`, `owl.video.play.png` and jQuery-UI icon sprites. Those references were set to `none`. Nothing visible changes.
- **Google map on /contact-us/.** The Google Maps embed is kept as-is (address 9535 Midwest Ave, Suite 114, Garfield Heights, OH 44125). In the local headless test, Google showed only its "Open in Maps" fallback on `localhost`. It is expected to render normally on a real domain, but this is **not verified**.

## Tracking and analytics IDs found

**None.** There is no Google Analytics, Google Tag Manager, Google Ads or Meta Pixel on any page of the live site. The only tracker was ReSimpli's own "resimpli-analytics-beacon", which reports to ReSimpli. It was not carried over, and nothing new was added.

## Fonts

| Live font | In this copy |
|---|---|
| Satoshi (Indian Type Foundry, free Fontshare/ITF license) | Self-hosted: the same Satoshi `.woff` files in `assets/fonts/` (Light, Regular, Medium, Bold, Black and italics) |
| Gilroy / Gilroy-Bold (paid) | **Plus Jakarta Sans** (SIL OFL), self-hosted as woff2 in `assets/fonts/`. It is also registered under the names `Gilroy` and `Gilroy-Bold` in `assets/css/fonts.css`, so the theme's existing rules pick it up. |
| Plus Jakarta Sans, Rubik (the theme loads them from Google Fonts) | Self-hosted: the Google Fonts CSS and woff2 files were downloaded into `assets/` |
| Font Awesome 4.7 / 5, Glyphicons, Material Design Iconic, Gravity Forms icons | Self-hosted in `assets/fonts/` |

## Files

- `assets/css/vendor/`: the original theme, block and Gravity Forms stylesheets, with URLs rewritten to local files. `assets/css/fonts.css` holds the font definitions. `assets/css/site.css` holds small additions (honeypot hiding, validation messages).
- `assets/js/vendor/`: jQuery 3.6.0 and Bootstrap 3, used for the pop-up and the testimonial carousel.
- `assets/js/site.js`: mobile side menu, sticky header, FAQ accordion and the "Get Offer Now" pop-up.
- `assets/js/forms.js` and `assets/js/config.js`: form handling, described above.
- `assets/img/`: all images (logo and favicons, hero, section photos, icons).

## Verification (2026-09-23)

- **Links and assets:** the local site was served and crawled. All 233 local URLs (14 pages plus every stylesheet, image and font) returned 200. There were 0 broken links, and 0 references to resimpliwebsites.com, `/wp-content/`, `/wp-includes/`, wp-admin or "Powered by REsimpli".
- **Visible text:** each page was compared word by word against the live page. The only differences are the changes listed above.
- **Look:** headless Chrome screenshots of the home page and `/step-2/` at 1280 px and 375 px were **pixel-identical** to the live site. FAQ matched too. Contact-us matched except the map (see above).
- **Mobile width:** at 375 px wide, none of the 14 pages scrolls sideways.
- **Behavior:** these were tested in a browser:
  - Home form: required-field errors appear, then it goes to step 2 pre-filled, then to the thank-you page.
  - Contact form: bad email and phone are rejected, then it goes to the thank-you page.
  - Phone formatting, the mobile menu, the pop-up and the FAQ accordion all work.
  - With the endpoint empty, each submission was logged to the console.
- **Not tested:** a real POST to a live endpoint, because none is configured yet.
