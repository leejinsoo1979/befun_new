# R5 locale UI handoff — locale_ui

## Implemented

- React-rendered translation calls in FurniturePanel, shared controls, LegacyControls, FeetSelector, ColorPicker, FurnitureConfigurator and DeskSectionEditor. Display labels, options, help, notices, title/aria text and save/share status translate. IDs, keys, intent payloads, furniture state, serialized designs and price values are unchanged.
- `lib/commerce/ui-dictionary.ts` exports `translate(source, language)`. Korean/English/Japanese copy covers core furniture controls, styles, materials/colors, desktop furniture edit/save/share UI, navigation and region settings. Dynamic section numbers, ceiling requirements and cable labels retain their numeric values.
- `components/commerce/MarketSelector.tsx`: `MarketSettings`, `MarketLabel`, reusable `MarketSelector`. Market settings expose KR/US/JP/EU and ten EU delivery countries, display coupled language/currency, and apply immediately without navigation from this component.
- RegionPage renders functional MarketSettings through the canonical useLocale adapter. CSS is isolated in market-selector.module.css.

## Concurrent i18n integration

A separate worker added `lib/i18n/I18nProvider`, translations, RegionSelector and layout wiring during this task. On leader instruction, that provider remains the canonical market state; the leader adapted useLocale to existing useI18n and a European-country-only useMarketStore. The new MarketSettings and MarketLabel consume that contract.

StorefrontFrame preserves the other worker's header RegionSelector and translations; its footer now renders MarketLabel (selected delivery country, language and currency) by leader authorization. Providers was restored to the original SessionProvider-only implementation; no duplicate hydration/document.lang effect remains. Unused other-worker SupportPages imports were removed concurrently after coordination. MarketSettings hydrates the persisted EU country on mount.

Pending integration observations sent to leader:
- Existing header RegionSelector switches four markets immediately; EU delivery-country selection currently lives on RegionPage. MarketSettings can be composed into the existing header selector if country selection is also wanted there.
- Footer now shows MarketLabel.

## Validation

- Final scoped ESLint: 0 errors, 0 warnings across all 12 checked TS/TSX files, including integrated footer and RegionPage.
- Reviewed diffs: control IDs, option IDs, style/material saved keys, emit values, numeric state and save/share payloads unchanged. DeskSectionEditor preserves its original return-focus lookup label; translated visible titles do not alter focus matching.
- No full build, shared server restart, or browser-state modification. Full integration/build/browser checks remain with the leader.

## Coverage boundaries

Legal/support prose, editorial product copy, unowned account/order/cart screens, original shelf auxiliary row/hardware/toolbar components and 3D annotations are outside this scoped translation pass. Existing i18n worker covers additional storefront copy. Unknown strings fall back to the source; this is core UI coverage, not a claim of complete site localization.

## Follow-up: legacy configurator and mobile controls

Leader assigned `src/app/configurator/page.tsx` and `src/components/ui/MobileConfiguratorPanel.tsx` plus necessary dictionary entries. Added useLocale translation for header/cart/shop/CNC text, storage title, purchase CTA, production lead-time copy, save/AR failure alerts, mobile tab labels, expand/collapse aria labels and compartment-edit guidance. Only display strings changed; handlers, routing, price calculations, design storage, tab keys and AR branches are unchanged.

Validation: scoped ESLint for these two components and dictionary passed with 0 errors / 0 warnings. Full browser validation remains with the leader. Child components (3D toolbar, floating compartment editor, AR/share modals) are not part of this extra pass, so this does not claim complete configurator or site localization. Locks released.
