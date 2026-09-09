# Commerce and interaction audit

Inspected 9 September 2026 in the live browser. These observations are separate from redesign proposals. One Kumkumadi Tailam was temporarily added to an initially empty basket to inspect checkout, then removed; the empty basket was verified. No account was created, forms sent, checkout submitted, or payment attempted.

## Observed routes and controls

| Route | Observed content and behavior |
| --- | --- |
| `/` | Search, account, amount/count basket, six main navigation items plus wishlist; four-frame hero carousel; product carousels; AM/PM routine promotion; customer feedback; email signup in indexed content; contact and policy footer; floating chat widget. |
| `/product/kumkumadi-facial-oil/` | Image zoom, breadcrumb, categories, ₹675 sale / ₹900 regular price, quantity, add to basket, wishlist, Description / Additional information / Reviews tabs, 15ml size, related products. No reviews; reviews restricted to logged-in purchasers. |
| `/wishlist/` | Table with product name/unit price and empty message. Populated interaction not yet exercised. |
| `/cart/` | Product image/title/link, price, quantity, subtotal, remove with undo, coupon input and Apply coupon, Update basket, shipping calculator, totals and checkout. Empty state links `/shop/`. |
| `/checkout/` | Returning-customer login, coupon reveal, billing first/last name, optional company, India, street/unit, city, state, PIN, phone, email; required create-account password; newsletter checkbox initially checked. Separate shipping checkbox initially checked, duplicate address fields visible. Optional order notes. Itemized order totals. Razorpay card/debit/netbanking option and Cash on delivery. Terms checkbox and Place order button. |
| `/my-account/` | Login username/email, password, remember me, lost-password link. Register email, password, initially checked newsletter checkbox. Privacy text link in account form points back to account rather than policy. |
| `/my-account/lost-password/` | Username/email input and Reset password, explanatory email-link text. Submission not exercised. |
| `/?s=rose` | Generic WordPress search results with products, author links, comment links, descriptions and Read More links; mixes products and informational pages. Ten results on first page and page 2/next controls. Product results include Rose Quartz Roller, Rosemary Essential Oil, Rose Essential Oil, Rose-orange Lip Balm, Sandalwood and Saffron Rose Water, Pure Rose Water, Body Butter and Body Butter (Copy). |

## Specific issues informing redesign

- Search presents products as blog excerpts, including author/comment metadata, rather than shoppable product cards; legal and masterclass pages are mixed into results. Add product-first search with a separate content tab.
- Required account creation adds checkout work. Design an optional account step with explicit guest checkout as a proposed upgrade.
- Newsletter and separate shipping are preselected. Redesign with opt-in newsletter and a single address by default, expandable billing differences.
- Shipping totals changed during this session: initially ₹675 with address-needed message, later ₹50 additional shipping and ₹725 total without an address being entered. Do not hard-code charges from this observation. Validate pricing/shipping rules against the business before implementation.
- Product description is repeated above and inside the Description tab. Organize description, ingredients, use, dimensions, care and reviews into one readable hierarchy.
- Text sizes, uppercase treatment, uneven content blocks and prominent default page labels reduce hierarchy; redesign around editorial headings, controlled whitespace, and clear calls to action.
- Login-protected order history/address/account details and actual order/payment confirmation states were not inspected. The visual set must label their designs as proposed states.

## Proposed new states

Guest checkout; account dashboard, orders/detail/tracking and addresses; stock notification; search suggestions and no-results; mini-bag drawer; mobile filters; inline validation and password-recovery confirmation. These are design proposals, not claims that those features exist today.

## Primary sources

- https://unravelbeautysecrets.in/
- https://unravelbeautysecrets.in/product/kumkumadi-facial-oil/
- https://unravelbeautysecrets.in/wishlist/
- https://unravelbeautysecrets.in/cart/
- https://unravelbeautysecrets.in/checkout/
- https://unravelbeautysecrets.in/my-account/
- https://unravelbeautysecrets.in/my-account/lost-password/
- https://unravelbeautysecrets.in/?s=rose
- [Complete Site Taxonomy & Route Audit](source-complete-taxonomy-audit.md)

