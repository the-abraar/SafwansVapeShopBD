# Project Issues, Vulnerabilities & Operational Audit
**Project:** Safwan's Vape Shop BD  
**Last Updated:** September 2026 (Post-Architecture Refactor)  
**Status:** Architecture Modernized; Critical Business & Operational Blockers Remain Active

---

## 📊 1. Progress & Resolution Scorecard

| Area | Issue ID | Previous State | Current Status | Resolution Details |
| :--- | :--- | :--- | :--- | :--- |
| **Code** | 3.1 Architecture | Monolithic 1,000-line `index.html` | ✅ **RESOLVED** | Decoupled into `styles.css`, `app.js`, `config.js`, and `products.json`. |
| **Code** | 3.3 Cart Flow Bug | Cart wiped before WhatsApp opens | ✅ **RESOLVED** | Cart preserved; order confirmation modal handles popup blockers & re-open actions. |
| **Code** | 3.4 Form Validation | Primitive empty string check; `alert()` | ✅ **RESOLVED** | Added Bangladeshi mobile regex (`/^01[3-9]\d{8}$/`), address length checks, and toast UI. |
| **Code** | 3.5 DOM Security | Raw `innerHTML` injection | ✅ **RESOLVED** | Sanitized via `escapeHTML()` utility. |
| **UX** | 4.3 Age Verification | Passive 12px footer disclaimer | ✅ **RESOLVED** | Interactive 18+ Age Gate modal with `localStorage` persistence. |
| **UX** | 4.4 Payment Friction | 100% advance bKash Send Money | 🟡 **MITIGATED** | Added Hybrid Payment mode (৳150 bKash delivery advance + remaining balance via COD). |
| **Ops** | 5.2 Order Ledger | Orders only existed in WhatsApp text | 🟡 **PARTIAL** | Added client-side `localStorage` order history + asynchronous webhook dispatch hook. |
| **Business**| 1.1–1.4 Unit Economics | Extreme RTO risk, bKash fee erosion | 🔴 **UNRESOLVED** | Blocked on shop owner (documented in `for_owner_blocked.md`). |
| **Legal** | 2.1–2.2 Regulatory Risk | Personal phone/domain exposed | 🔴 **UNRESOLVED** | Public PII still exposed in config and git history; regulatory status of ENDS in BD remains perilous. |

---

## 💻 2. Technical Audit: Codebase Critique (New Work)

### 2.1 [NEW BUG] Accidental Duplicate File in Repository
* `foe_owner_blocked.md` and `for_owner_blocked.md` are 100% byte-for-byte identical duplicates.
* A typo during git staging created duplicate tracking. `foe_owner_blocked.md` should be removed from git.

### 2.2 Client-Side Webhook Exposure & Reliability Limitation
* In `config.js`:
  ```javascript
  orderWebhookUrl: ""
  ```
  And in `app.js#L828-L836`:
  ```javascript
  fetch(window.CONFIG.orderWebhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderRecord)
  })
  ```
  * **Security Vulnerability:** Because this is executed purely on the client side, if a real webhook URL (e.g. Google Apps Script or Supabase endpoint) is added, it is exposed in cleartext to anyone viewing page source. Malicious users or scrapers can spam fake orders or exhaust rate limits.
  * **Silent Failure with `mode: 'no-cors'`:** `no-cors` returns an opaque response with status `0`. The client application cannot verify whether the webhook actually accepted, stored, or dropped the order payload.

### 2.3 Hardcoded Placeholder in Production Configuration
* In `config.js#L19`:
  ```javascript
  bkashNumber: "017XX-XXXXXX"
  ```
  * If the website is deployed to Vercel or GitHub Pages in its current state, users clicking "Copy" or following the payment instruction will attempt to send money to an invalid placeholder number. The frontend must have a fallback guard preventing checkout if the bKash number contains placeholder masks (`XX`).

### 2.4 Device-Bound Order History (`localStorage`)
* While `sv_orders` correctly saves the customer's order on their own browser, this does **not** provide Babu Bhai or the digital operator with a centralized merchant dashboard.
* If the webhook is unset, order reconciliation still completely depends on reading raw WhatsApp messages.

### 2.5 Pathao 1% COD Collection Fee Omission
* Pathao charges a mandatory **1% Cash on Delivery (COD) collection fee** when remitting cash collected from customers.
* On a ৳3,550 kit with ৳3,400 COD balance, Pathao automatically deducts **৳34.00** from the payout.
* When combined with the ৳50–60 bKash cash-out fee and return delivery allowances, the merchant's net profit margin of ৳100–150 is virtually evaporated. The calculator does not account for this fee in the customer breakdown or backend ledger.

### 2.6 Out-of-Stock UI State Incomplete
* `products.json` introduces `"inStock": true`, but `app.js` lacks logic to disable the `+ Add` button, show an "Out of Stock" ribbon, or prevent adding unavailable items to the cart if `inStock` is set to `false`.

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

### 3.2 Age Gate Bypass
* The age gate modal uses `localStorage.getItem('sv_age_verified') === 'true'`.
* While standard for web implementations, clicking "Under 18" simply redirects to `google.com`. A simple browser refresh or incognito window allows instant re-entry. It is an effective visual deterrent, but offers limited legal shield against targeted regulatory scrutiny.

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

### Immediate Code & Repo Cleanups:
1. [ ] **Delete Duplicate File:** Remove `foe_owner_blocked.md` (`git rm foe_owner_blocked.md`).
2. [ ] **Add Out-of-Stock Logic:** Update `renderProducts()` in `app.js` to render disabled buttons and "Stock Out" tags when `p.inStock === false`.
3. [ ] **bKash Validation Guard:** Disable checkout submission if `window.CONFIG.bkashNumber` contains `"XX"`.
4. [ ] **COD Fee Factor:** Deduct Pathao's 1% COD charge from estimated profit calculations.

### Physical Store Milestones (Before Any Ad Spend):
1. [ ] **Secure Real Photos:** Replace SVGs with 2 real photos per product taken inside the New Market shop showcasing sealed boxes and verification codes.
2. [ ] **Written Settlement & RTO Terms:** Sign a simple 1-page agreement with Babu Bhai specifying weekly settlement terms and a 50/50 or shop-absorbed RTO policy.
3. [ ] **Reserve Bin:** Confirm physical reserve stock of 2 units per active SKU in the shop counter.
