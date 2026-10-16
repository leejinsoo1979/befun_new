# Korean fictional portraits

Built-in image_gen used; four independent new images, not edits of real people.
Final assets: public/imgs/pro/korean-designer-1.webp through korean-designer-4.webp (520×520).
Names are fictional first names. Copy identifies AI-generated fictional people and illustrative concepts, not customer testimonials.

Prompts, in order:

+1. Photorealistic natural editorial portrait for furniture design website. Square image, head and shoulders of a fictional Korean woman interior designer aged 38, short black bob, charcoal linen jacket, airy material library background. Entire head and shoulders comfortably contained in central 70 percent for a circular crop. Natural anatomical proportions, softly blurred background, soft window daylight, candid relaxed expression, authentic skin texture. Entirely imaginary person, not a celebrity or identifiable real person. No text, logo, border or circle mask. One person only.
2. Photorealistic natural editorial portrait for furniture design website. Square image, head and shoulders of a fictional Korean man furniture designer aged 34, wavy black hair, round glasses, oatmeal overshirt, architectural studio background. Entire head and shoulders comfortably contained in central 70 percent for a circular crop. Natural anatomical proportions, softly blurred background, soft window daylight, candid relaxed expression, authentic skin texture. Entirely imaginary person, not a celebrity or identifiable real person. No text, logo, border or circle mask. One person only.
3. Photorealistic natural editorial portrait for furniture design website. Square image, head and shoulders of a fictional Korean woman cafe owner aged 42, shoulder length dark hair, dark olive shirt, warm minimalist cafe background. Entire head and shoulders comfortably contained in central 70 percent for a circular crop. Natural anatomical proportions, softly blurred background, soft window daylight, candid relaxed expression, authentic skin texture. Entirely imaginary person, not a celebrity or identifiable real person. No text, logo, border or circle mask. One person only.
4. Photorealistic natural editorial portrait for furniture design website. Square image, head and shoulders of a fictional Korean man architect aged 48, salt and pepper hair, navy unstructured jacket, neutral architectural office background. Entire head and shoulders comfortably contained in central 70 percent for a circular crop. Natural anatomical proportions, softly blurred background, soft window daylight, candid relaxed expression, authentic skin texture. Entirely imaginary person, not a celebrity or identifiable real person. No text, logo, border or circle mask. One person only.

CSS fix: explicit equal width/height and min-width/min-height, aspect-ratio:1, flex:0 0 auto, align-self:flex-start, object-fit:cover, border-radius:50%. Desktop130×130/mobile100×100 independently measured for all4 in actual localhost UI; images loaded successfully.
Scoped lint PASS. Full lint and isolated webpack build logs in /private/tmp/befun-pro-portraits-{lint,build}.log.

Final validation: full lint0errors15existingwarnings; isolated production webpack/TypeScript/route generation PASS.

## Compact cards / user copy correction
- Removed590px minimum card height; desktop fixed340px width and390px minimum, observed340×415px at1280 viewport; mobile observed301×370 at390 viewport. Portraits retain130px/100px circles.
- Replaced abstract promotional descriptions with fictional first-person design needs (not fabricated completed-purchase reviews), updatedKO/EN/JA and localized job labels. Removed italics; desktop18px/mobile17px, keep-all wrapping and tighter spacing.
- Browser verified new /befun-pro route after concurrent owner's redirect from old URL. Mobile scrollWidth390, no horizontal page overflow. Scoped lintPASS/full lint0errors13existingwarnings; isolated webpack/TypeScript buildPASS. Showroom and route-owner edits preserved.
