# Unravel redesign: implementation handoff

Design direction: **Botanical Atelier**. Scope: a future Vercel storefront backed by Supabase. This handoff supports the image concepts; it does not implement, deploy, connect accounts, or establish new business policies. The [commerce audit](source-commerce-audit.md) records live observations on 9 September 2026. The [image prompts](image-prompts.json) and [individual prompts](prompts/) describe proposed presentation and interactions, not an authoritative product database.

## 1. Preserve pages through reusable route families

Build one content-driven template per family, with individual records supplying each page. Preserve every verified source page in a migration manifest containing old URL, page type, new URL, content owner, and verification status. Prefer retaining established public URLs; use permanent redirects where a new structure is chosen. Do not remove a source page merely because it shares another page's layout.

| Family | Observed source or design scope | Proposed implementation |
| --- | --- | --- |
| Home | `/`, hero, product carousels, routine promotion, feedback, signup and footer | Editorial hero, category discovery, product rows, routine and masterclass features. |
| Catalog | `/shop/` is linked by the empty basket; prompts cover Skin, Hair, Body and Wellness | Shared collection template with product-type navigation, concern filters, price, availability, sorting and pagination. Confirm all source category/subcategory URLs against the catalog inventory. |
| Product | `/product/kumkumadi-facial-oil/` inspected | `/product/[slug]/` for every verified product; gallery, variants, quantity, availability, details, reviews and related products. |
| Routine | Daily skincare routine appears in the design scope | Source-backed collection with proposed AM/PM navigation; keep product directions separate from editorial sequencing. |
| Editorial | About and masterclass appear in the design scope | Reusable rich-content sections; a separate workshop detail record when verified source pages require it. |
| Search | `/?s=rose`, with mixed WordPress results | Product-first search plus content results; support legacy search URLs and preserve query, filters and pagination in navigation. |
| Saved and basket | `/wishlist/`, `/cart/` | Wishlist, basket and proposed mini-bag drawer; handle empty, populated, unavailable and changed-price states. |
| Checkout | `/checkout/` | Proposed guest-first flow with contact, address, payment and server-confirmed totals. |
| Account | `/my-account/`, `/my-account/lost-password/` | Sign-in, registration and recovery; authenticated dashboard, orders, addresses and settings are proposed, uninspected states. |
| Help and legal | Contact and policy links observed in the footer | A readable legal/content template with verified individual page text and links; do not merge distinct policies solely for visual convenience. |

Treat order confirmation, failed/pending payment, password-reset confirmation, stock alerts, search suggestions and account interiors as additional proposed states. They must never suggest an actual order, payment, notification or account was created during design review.

## 2. Translate the visual direction into a small UI system

Use warm ivory `#F7F3EB`, aubergine `#432735`, saffron `#C79958`, blush `#E9DADA` and sage `#DDE1D5` as starting tokens. Verify actual contrast before assigning text and interactive roles. Pair an editorial serif for headings with a readable sans serif for controls, prices and body copy. Establish consistent spacing, type scales, thin borders, rectangular actions and image ratios.

Reusable elements: announcement bar; desktop/mobile navigation; breadcrumb; product card; price and variant selector; quantity control; wishlist control; collection filter; sort menu; gallery; tabs/accordion; form field with validation; coupon control; totals summary; status message; newsletter form; and footer. Use a simplified shell for checkout and authentication. Label icon-only controls and distinguish links from buttons.

Generated product photography is conceptual packaging. Replace it with approved catalog photography before launch, preserving accurate size, label and product identity. Keep editorial images separate from authoritative product media. Image-generated text is a visual guide: implement real editable text, not screenshot slices. Do not publish simulated ratings, testimonials, certifications or results.

## 3. Interaction, mobile and accessibility requirements

- Stack editorial layouts at narrow widths without changing content order. Start with two catalog columns where names and prices remain readable; fall back to one when needed. Expose filters in an accessible drawer with selected count, clear/reset, and apply behavior.
- Keep product selection and total visible near the purchase action. A proposed mobile sticky purchase bar must respect selected variants, unavailable stock, keyboard focus and safe-area space; it must not cover content.
- Use semantic headings, native labeled inputs, keyboard-operable menus, visible focus, sufficient touch targets and reduced-motion behavior. A drawer/dialog traps focus while open, closes with Escape and returns focus to its trigger.
- Announce basket changes and validation errors accessibly. Preserve entered form values after errors. Link an error summary to affected fields and explain errors in text, not color alone.
- Design loading, empty, no-results, network-error and retry states. Recheck price and availability before payment and explain changes before asking the shopper to continue.
- Make newsletter consent unchecked. The proposed address flow uses one delivery address and an expandable different billing address. Offer guest checkout and optional account creation only once the business accepts that proposed change.

## 4. Proposed Supabase data and access boundaries

Model catalog data with `products`, `product_variants`, `product_media`, `categories`, `product_categories`, `collections`, `collection_items` and `content_pages`. Store money as integer minor units with an explicit currency. Give variants stable identifiers, size labels, SKU, price and availability. Preserve source URLs and migration IDs separately from public slugs. Store shipping, discounts and workshop status as managed business data rather than values embedded in components.

Use Supabase Auth identity for `profiles`; separate `addresses`, `wishlists` and `wishlist_items`. Add `orders`, `order_items`, `order_addresses`, `payment_attempts` and `order_events` for commerce. Order items and addresses retain purchase-time snapshots so later catalog/profile edits do not alter historical receipts. Proposed `reviews`, `newsletter_consents`, `stock_alert_requests` and `workshop_interest` require explicit workflow decisions before activation.

Enable row-level security on application tables. Public access reads only published catalog/content and approved public reviews. Authenticated customers read/update their own permitted profile, addresses and saved items; they read only their own orders. Clients cannot set owner IDs arbitrarily, assign roles, alter purchase snapshots, mark orders paid, change stock or write payment records. Enforce review eligibility on the server: the observed source restricts reviews to logged-in purchasers. Keep administration permissions separate from customer permissions. Store personal data outside public storage buckets; publish only approved product/editorial media.

An anonymous guest basket can be local UI state, but its prices and quantities are untrusted. Guest order access needs a limited, server-validated mechanism, never a publicly readable order table or an order number alone. Keep privileged Supabase credentials and payment secrets in server-only deployment configuration. Expose only intended public configuration to the browser, with policies enforcing access.

## 5. Checkout and payment boundary

Razorpay and cash on delivery were observed. Confirm merchant configuration and eligibility rules before implementation; do not infer every payment method from the provider's brand. A Vercel server endpoint validates product/variant IDs, quantities, stock, coupon conditions, shipping destination and current prices, then calculates the payable amount. The browser displays that result and cannot supply the authoritative total.

Create payment attempts and process verified provider notifications on the server. Authenticate notification signatures, prevent duplicate processing, and make order/payment transitions repeatable without duplicate charges or orders. A client redirect is insufficient proof of payment. Keep pending, successful, failed and cancelled states distinct. For cash on delivery, an accepted order does not mean money has been received. Never collect or store card credentials in Supabase.

## 6. Content parity and release acceptance

Before build completion, reconcile every source URL and product against the final inventory: names, descriptions, ingredients, directions, sizes, variant prices, sale prices, stock, categories, media, review restrictions, contact details and policy links. Confirm shipping thresholds and charges separately: the audit observed inconsistent shipping totals. Mockup banner text and sample basket amounts are not a shipping specification.

Verify About copy, founder names and brand claims against approved content. Keep the historic masterclass date/fee distinct from any future session; do not imply live booking without confirmed event data. Preserve real testimonials only with correct attribution. Repair broken account-policy links using verified destinations.

Acceptance requires route/redirect coverage, accessible desktop/mobile review, working filter/search navigation, correct variant and basket math, guest/account access isolation, provider sandbox checkout tests, duplicate-notification handling, recovery/error states, and complete approved legal/contact content. Validate implementation against both source parity and the reviewed images; polished screenshots alone do not establish functional completion.
