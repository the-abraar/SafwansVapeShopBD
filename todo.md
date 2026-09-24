# Safwan's Vape Shop BD — Action Plan & To-Do List

## 📌 Project Overview
* **Store Owner:** Babu Bhai & Safwan (Physical store in New Market, Dhaka)
* **Tech & Marketing Partner:** Abrar Masud (Phone: `01327045005`, Website: `blankframe.tech`)
* **Business Model:** E-commerce storefront -> WhatsApp order routing -> bKash payment -> Pathao courier dispatch
* **Revenue:** Dual stream (Retail price markup + ৳100 commission/kit & ৳50 commission/cartridge from shop)

---

## ✅ Completed (Done)
- [x] Initial business plan and customer journey documented (`init_idea.md`)
- [x] Frontend MVP built with responsive clean design, Bangla/English mix, bKash instructions, cart drawer, and WhatsApp order generator (`index.html`)
- [x] Legal status of Section 6(Ga) and High Court writ petition researched
- [x] Outreach email drafted & sent to **Vapor Cloud Ltd** (`vaporcloudltd@gmail.com`) for wholesale/authorized sourcing
- [x] Outreach email drafted & sent to **BENDSTA** (`gs.bendsta@gmail.com`) for membership and supplier directory
- [x] Outreach email drafted & sent to **Mahbub & Company** (`contact@mahbub-law.com`) for legal consultation
- [x] Connected Abrar's actual WhatsApp (`8801327045005`) for order processing and floating contact button in `index.html`
- [x] Decoupled frontend architecture into `styles.css`, `config.js`, `products.json`, and `app.js`
- [x] Fixed cart wiping flow bug; added order confirmation modal with WhatsApp re-open & ledger
- [x] Implemented interactive 18+ Age Gate modal with persistent verification and lockout screen (`sv_age_denied`)
- [x] Implemented Hybrid Payment model (৳150 bKash delivery advance + remaining balance COD) and delivery rate calculator
- [x] Added robust Bangladeshi phone validation (`/^01[3-9]\d{8}$/`), address validation, and modern toast notifications
- [x] Upgraded placeholder cards with sleek vector SVG product art & authenticity specs
- [x] Implemented out-of-stock UI state with "Stock Out" badges, disabled buttons, and cart addition guards
- [x] Added bKash placeholder validation guard and setup mode alert banner for `017XX-XXXXXX`
- [x] Explicitly integrated Pathao 1% COD collection fee deduction into checkout calculations, order ledger, and owner profit models
- [x] Built in-browser Merchant Order Ledger modal with 1-click Pathao Courier bulk CSV export
- [x] Deleted duplicate repository file `foe_owner_blocked.md` and cleaned up documentation references

---

## 🛑 Physical Owner Milestones (Pending — Action Required from Babu Bhai & Safwan)

- [ ] **bKash Merchant / Personal Account Registration:** Get Babu Bhai / Safwan's official bKash account number and update in `config.js` (replacing placeholder `017XX-XXXXXX`).
- [ ] **Product Photos from New Market Shop:** Capture 1–2 real photos per product showcasing sealed packaging, authenticity codes, and verification scratch-offs to replace vector SVGs.
- [ ] **Dedicated Physical Reserve Shelf:** Confirm physical reserve stock of at least 2 units per active SKU in the New Market shop counter, isolated from walk-in retail sales.
- [ ] **Finalize Models & Pricing Tier:** Confirm exact top-selling models, store wholesale/retail baseline, and customer selling prices (including commission markup).
- [ ] **Formalize RTO & Settlement Agreement:** Sign a 1-page agreement specifying weekly settlement day (e.g. every Friday) and RTO courier penalty absorption (50/50 split or shop-absorbed).
- [ ] **Pathao Merchant Account Logistics:** Confirm whether Pathao parcels will be booked under Babu Bhai's merchant account or through Abrar's portal with New Market pickup.

---

## 🚀 Technical & Operational Next Steps

### 1. Deployment & Domain
- [ ] **Deploy Live:** Host repository on Vercel or GitHub Pages.
- [ ] **Subdomain Setup:** Map to `vape.blankframe.tech` or `shop.blankframe.tech`.
- [ ] **Demo to Babu Bhai:** Share the live link on WhatsApp so he can test ordering on his phone.

### 2. Supplier & Legal Follow-up (If no email response within 48–72 hours)
- [ ] **BENDSTA Phone Follow-up:** Call office at `+8801793-008486` (Alam Arcade, North Gulshan).
- [ ] **Vapor Cloud In-person Visit:** Visit Shop 422, Level 4, Plaza AR, Dhanmondi (conveniently close to New Market) or call `01730860686`.
- [ ] **Mahbub & Company:** Follow up with chamber at `+88 017 2955 4986` if legal consultation is required before scaling.
