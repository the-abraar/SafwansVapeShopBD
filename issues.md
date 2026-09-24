# Project Issues, Vulnerabilities & Operational Audit
**Project:** Safwan's Vape Shop BD  
**Last Updated:** September 2026 (Post-Architecture Refactor)  
**Status:** Architecture Modernized; Critical Business & Operational Blockers Remain Active

---

## 📊 1. Progress & Resolution Scorecard

| Area | Issue ID | Previous State | Current Status | Resolution Details |
| :--- | :--- | :--- | :--- | :--- |
| **Code** | 3.1 Architecture | Monolithic 1,000-line `index.html` | ✅ **RESOLVED** | Decoupled into `styles.css`, `app.js`, `config.js`, and `products.json`. |
| **Code** | 2.1 Duplicate File | Accidental duplicate `foe_owner_blocked.md` | ✅ **RESOLVED** | Deleted `foe_owner_blocked.md` and cleaned up all repo references. |
| **Code** | 2.2 Webhook Reliability | Client-side unhandled fire-and-forget webhook | 🟡 **MITIGATED** | Added timeout management with `AbortController`, structured dispatch payload, and delivery status logging in `sv_orders` ledger. |
| **Code** | 2.3 bKash Placeholder | Hardcoded `"017XX-XXXXXX"` in checkout | ✅ **RESOLVED** | Added placeholder detection guard and fallback UX preventing invalid transactions. |
| **Code** | 2.6 Out-of-Stock State | Missing UI & cart guards for out-of-stock SKUs | ✅ **RESOLVED** | Added disabled buttons, "Stock Out" badges, and cart validation guards. |
| **Code** | 3.3 Cart Flow Bug | Cart wiped before WhatsApp opens | ✅ **RESOLVED** | Cart preserved; order confirmation modal handles popup blockers & re-open actions. |
| **Code** | 3.4 Form Validation | Primitive empty string check; `alert()` | ✅ **RESOLVED** | Added Bangladeshi mobile regex (`/^01[3-9]\d{8}$/`), address length checks, and toast UI. |
| **Code** | 3.5 DOM Security | Raw `innerHTML` injection | ✅ **RESOLVED** | Sanitized via `escapeHTML()` utility. |
| **UX** | 3.2 Age Gate Bypass | Soft redirect allowing instant refresh bypass | ✅ **RESOLVED** | Added persistent `sv_age_denied` lockout screen preventing immediate back/refresh bypass. |
| **UX** | 4.3 Age Verification | Passive 12px footer disclaimer | ✅ **RESOLVED** | Interactive 18+ Age Gate modal with `localStorage` persistence. |
| **UX** | 4.4 Payment Friction | 100% advance bKash Send Money | 🟡 **MITIGATED** | Added Hybrid Payment mode (৳150 bKash delivery advance + remaining balance via COD). |
| **Ops** | 2.4 Order History | Orders trapped on client browser localStorage | 🟡 **MITIGATED** | Added in-browser Merchant Order Ledger modal with 1-click Pathao Courier CSV export. |
| **Ops** | 5.2 Order Ledger | Orders only existed in WhatsApp text | 🟡 **MITIGATED** | Added client-side `localStorage` order history + asynchronous webhook dispatch hook. |
| **Business**| 2.5 Pathao COD Fee | Omitted 1% Pathao COD fee from calculations | ✅ **RESOLVED** | Explicitly calculated 1% COD deduction and net merchant payout in pricing logic, ledger, and owner economics. |
| **Business**| 1.1–1.4 Unit Economics | Extreme RTO risk, bKash fee erosion | 🔴 **UNRESOLVED** | Blocked on shop owner (documented in `for_owner_blocked.md`). |
| **Legal** | 2.1–2.2 Regulatory Risk | Personal phone/domain exposed | 🔴 **UNRESOLVED** | Public PII still exposed in config and git history; regulatory status of ENDS in BD remains perilous. |

---

## 💻 2. Technical Audit: Codebase Critique & Resolutions

### 2.1 [RESOLVED] Accidental Duplicate File in Repository
* `foe_owner_blocked.md` was removed from repository tracking; `for_owner_blocked.md` remains the single canonical source of truth for owner-dependent operational issues.

### 2.2 [MITIGATED] Client-Side Webhook Exposure & Reliability Limitation
* In `config.js` and `app.js`:
  * **Mitigation:** Implemented timeout handling via `AbortController` (8-second ceiling), structured payload dispatch, and explicit delivery status logging (`"sent"`, `"failed"`, `"unconfigured"`) stored in the local `sv_orders` ledger.
  * **Remaining Architectural Limitation:** Because client-side requests expose endpoint URLs, high-volume production should route webhooks via an edge serverless function or API gateway to completely eliminate endpoint scraping and rate exhaustion.

### 2.3 [RESOLVED] Hardcoded Placeholder in Production Configuration
* In `config.js` (`bkashNumber: "017XX-XXXXXX"`):
  * **Resolution:** Added placeholder detection guard (`CONFIG.bkashNumber.includes("XX")`). Checkout UI presents a prominent warning banner (*"⚠️ পেমেন্ট নাম্বার সেটআপাধীন — WhatsApp এ কনফার্ম করে নাম্বার দেওয়া হবে"*), prevents copying placeholder text as a valid bKash number, and disables misleading direct transfers.

### 2.4 [MITIGATED] Device-Bound Order History (`localStorage`)
* **Mitigation:** Implemented an in-browser **Merchant Order Ledger modal** (accessible via secret operator shortcut and footer link) displaying all recorded orders from `localStorage.sv_orders`, complete with order statuses, COD dues, and a **1-click Pathao Courier CSV export** formatted for bulk parcel booking.

### 2.5 [RESOLVED] Pathao 1% COD Collection Fee Omission
* **Resolution:** Pathao's mandatory 1% Cash on Delivery collection fee (`dueOnDelivery * 0.01`) is now explicitly accounted for in checkout calculations, logged in the order record ledger (`estimatedCodFee` and `estimatedMerchantNetPayout`), and factored into the business economics breakdown in `for_owner_blocked.md`.

### 2.6 [RESOLVED] Out-of-Stock UI State Incomplete
* **Resolution:** Added full out-of-stock UI state management in `renderProducts()`: items with `inStock: false` render an unmistakable *"স্টক আউট / Out of Stock"* badge, display disabled *"Stock Out"* action buttons, apply dimmed card opacity, and are guarded against programmatic cart addition.

---

## 🎨 3. Website UX & Conversion Reality

### 3.1 SVG Artwork vs. Real Dhaka Market Dynamics
* The custom vector SVGs (`caliburn-g3`, `xros-3`, `oxva-xlim-pro`) are visually well-crafted and far superior to generic emojis.
* However, in Bangladesh's vape market, **counterfeits, refurbished units, and clone coils are exceptionally common**.
* Vapers in Dhaka look for:
  1. Real photographs of physical packaging.
  2. Proof of intact holographic manufacturer scratch-off authentication stickers.
  3. Physical seal integrity.
* Vector SVGs look like software mockups. High-intent customers ready to spend ৳3,500+ often hesitate without seeing real product photos from the physical shop shelf.

### 3.2 [RESOLVED] Age Gate Bypass
* **Resolution:** Replaced the simple soft redirect with a persistent `sv_age_denied` storage state and a full-screen **Access Denied Lockout view**. Users who select "Under 18" are blocked from bypassing the verification via browser back-navigation or page reloads.

---

## 🛑 4. Business & Operational Blockers (Owner Dependent)

As documented in `for_owner_blocked.md`, software improvements have reached the threshold of what digital code can solve. The remaining existential risks are physical:

### 4.1 Uncommitted bKash Merchant / Personal Account
* Babu Bhai has not provided an official, operational bKash number.
* Without an active account, live checkout testing cannot proceed.

### 4.2 Sunk Return-to-Origin (RTO) Costs
* Courier return rates in Bangladesh e-commerce average 10%–20%.
* With forward + return Pathao courier fees totaling ৳120–160 per failed delivery, **one single rejected delivery cancels out the gross profit of 2 to 3 successful kit sales**.
* No written agreement exists detailing whether Babu Bhai or the digital operator absorbs these return losses.

### 4.3 Courier Terms of Service Violation (Pathao)
* **Crucial Legal Fact:** Pathao's official courier terms explicitly prohibit the transit of electronic cigarettes, tobacco, and nicotine products.
* If a package is flagged or inspected during hub transit or police checkposts, the item is liable to confiscation and the Pathao merchant account will be blacklisted.

### 4.4 Disintermediation (Offline Customer Leakage)
* Every delivered package contains shop identification. Repeat buyers purchasing replacement pods and e-liquids will inevitably bypass the digital storefront and purchase directly from Babu Bhai at New Market, cutting out the digital partner after paying the initial customer acquisition cost.

---

## ⚖️ 5. Regulatory & Compliance Threat Model

1. **Digital Paper Trail:** The digital partner's personal phone number (`01327045005`), portfolio domain (`blankframe.tech`), and WhatsApp account remain the public face of the operation.
2. **Ministry of Health Anti-Tobacco Amendments:** Enforcement against unlicensed online ENDS sales remains active. Operating without trade licenses, import tax documentation, or corporate entity shielding creates direct penal exposure.
3. **Cold Outreach Ineffectiveness:** Outreach emails to BENDSTA, Vapor Cloud, and Mahbub & Company remain unanswered because large authorized distributors operate on bulk B2B purchase orders, not dropshipping arrangements.

---

## 📋 6. Actionable Next Steps

### Completed Code & Repo Cleanups:
1. [x] **Delete Duplicate File:** Removed `foe_owner_blocked.md` (`git rm foe_owner_blocked.md`).
2. [x] **Add Out-of-Stock Logic:** Implemented out-of-stock badges, disabled buttons, and cart addition guards for unavailable SKUs.
3. [x] **bKash Validation Guard:** Added placeholder detection and setup warning banner preventing invalid transactions.
4. [x] **COD Fee Factor:** Deducted Pathao's 1% COD charge from pricing logic, ledger payout, and profit models.
5. [x] **Merchant Order Ledger & Pathao Bulk CSV Export:** Added in-browser order ledger with 1-click Pathao Courier CSV export.
6. [x] **Age Gate Denial Lockout:** Enforced persistent `sv_age_denied` lockout screen preventing immediate back/refresh bypass.

### Physical Store Milestones (Before Any Ad Spend — Blocked on Owner):
1. [ ] **Secure Real Photos:** Replace SVGs with 2 real photos per product taken inside the New Market shop showcasing sealed boxes and verification codes.
2. [ ] **Written Settlement & RTO Terms:** Sign a simple 1-page agreement with Babu Bhai specifying weekly settlement terms and a 50/50 or shop-absorbed RTO policy.
3. [ ] **Reserve Bin:** Confirm physical reserve stock of 2 units per active SKU in the shop counter.
4. [ ] **bKash Merchant Account:** Register an official bKash Merchant / Personal account for the store to replace placeholder `017XX-XXXXXX`.
