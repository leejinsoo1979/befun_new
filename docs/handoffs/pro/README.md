# Befun Pro — 2026-10-16

- URL: http://localhost:3003/tylko-pro
- Reference: https://tylko.com/de-de/tylko-pro (actual Chrome, desktop).
- New explicit Next route overrides generic catchall Pro page without modifying shared EditorialPages/StorefrontFrame.
- Full-width photo hero, 3-column introduction, 6-category project gallery, material image + expandable benefits, full-width brand panel, material/showroom CTA, two-step contact form. Black/white buttons; responsive 390px layout.
- 19 local original page assets; source mapping in assets.json. Asset requests through curl returned403; browser-observed pageAssets export succeeded. Project cards explicitly label Tylko Pro reference projects. Unverified discounts, warranties and endorsements are not represented as Befun terms/customers.
- Inquiry prepares mailto:contact@befun.co.kr (existing storefront business contact). User reviews and sends in mail app. No backend registration/automatic delivery is claimed; no external test message sent.

## Validation
- PASS: scoped ESLint, full lint (0 errors,16 existing unrelated warnings), isolated production webpack build including TypeScript and route generation.
- Build: /private/tmp/befun-pro-build-e8oo63rh; command ./node_modules/.bin/next build --webpack. Shared3003/.next untouched. First build missing copied reference docs and font network access; copied dependency docs and reran with network allowed, final PASS.
- PASS Chrome desktop: hero/photos, Residential3cards, next reaches last and disables, Public1card, material accordion opens link, CTA scroll, form step1→2→back preserves QA name/email, error console0.
- PASS in-app browser390×844: hero typography and nav fit, horizontal tabs, ArrowRight selects Residential, inquiry layout, page scrollWidth390=viewport390, loaded images broken0. Viewport reset afterward.
- Chrome mobile: blocked by repeated browser disconnect during viewport attempt; mobile validation performed in in-app browser instead.
- Email delivery: not tested, mailto handoff only. No DB/account registration added.
- Shared product sources and other agent work unchanged. No commit/push for this task.

## Visual correction after user comparison
- Previous adaptation omitted the creators and showroom sections and moved the form photograph into an unrelated split CTA. Corrected the section order, restored four portrait cards and eight showroom cards, and placed the photograph beneath the application introduction.
- Reference measured at1280px: hero600px; section headings32px; hero54px; page gutters48px. Applied these and the larger desktop breakpoint, square gallery images, overlay captions, black navigation pill scoped only to this route, and left-aligned full-width brand panel.
- Added12 original image assets from browser-observed resources (additional-assets.json). Creator descriptions are paraphrased project summaries, expressly attributed to Tylko, not fabricated Befun endorsements; showroom cards are Tylko references.
- PASS: desktop1280 and mobile390 page width equals viewport, loaded images broken0, consoleerrors0. Residential tab/next disabled at end; mobile inquiry step1→2 with QA data without transmitting mail. Final heading computed32px desktop/30px mobile. revision-desktop.png saved.
- PASS scoped ESLint; full lint0errors13existingwarnings; isolated webpack build including TypeScript and route generation. Final build copied only Pro files/assets into previously verified isolated snapshot. Shared running3003 untouched.
- Remaining intentional differences: Befun brand/Korean copy, six truthful benefits rather than unconfirmed original eight commercial promises, static brand image rather than reference video, email inquiry rather than original B2B registration, existing shared footer. This is not a pixel-identical or business-function-equivalence claim.
