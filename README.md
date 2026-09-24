# Safwan's Vape Shop BD — Online Storefront & Operations Engine

A lightweight, mobile-optimized digital storefront and order dispatch system for **Safwan's Vape Shop**, based in New Market, Dhaka, Bangladesh.

The platform bridges physical brick-and-mortar vape retail with digital customer acquisition using a streamlined **Web-to-WhatsApp** order orchestration workflow, localized bKash payment verification, and automated Pathao logistics dispatch.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Core Features](#-core-features)
4. [Configuration Guide (`config.js`)](#-configuration-guide-configjs)
5. [Local Development & Testing](#-local-development--testing)
6. [Deployment Guide](#-deployment-guide)
7. [Operational Guide for Shop Owner & Tech Partner](#-operational-guide-for-shop-owner--tech-partner)
8. [Legal & Regulatory Compliance Notice](#-legal--regulatory-compliance-notice)
9. [Documentation Directory](#-documentation-directory)

---

## 🌟 Project Overview

* **Physical Location:** New Market, Dhaka, Bangladesh.
* **Store Management:** Babu Bhai & Safwan.
* **Target Market:** Dhaka metropolitan area (with nationwide Pathao courier coverage).
* **Tech Stack:** Vanilla JavaScript (ES6+), Semantic HTML5, CSS3 with CSS Variables, FontAwesome icons, and Google Fonts (Inter + Noto Sans Bengali).
* **Zero-Server Overhead:** Designed to run entirely as a client-side static web application with optional serverless webhook logging (Google Sheets / Supabase / Discord webhook).

---

## 🏗 System Architecture

The project is structured for high reliability, zero server hosting costs, and fast mobile loading times over local mobile data networks (4G/3G in Dhaka):

```
SafwansVapeShopBD/
│
├── index.html               # Main single-page storefront entrypoint
├── config.js                # Environment configuration (bKash numbers, WhatsApp, URLs)
├── products.json            # Structured product catalog & inventory statuses
├── styles.css               # Modular design system & responsive layout
├── app.js                   # Application state, cart engine, and modal controllers
│
├── emails/                  # Formal outreach & regulatory inquiry records
│   ├── bendsta.md           # Trade association inquiry (BENDSTA)
│   ├── mahbub_law.md        # High Court legal chamber consultation brief
│   └── vapor_cloud.md       # Authorized importer wholesale sourcing inquiry
│
├── issues.md                # Comprehensive technical & business critique
├── for_owner_blocked.md     # Owner & partner non-code blocking issues dossier
├── init_idea.md             # Initial conceptual framework & workflow model
├── todo.md                  # Project task list & operational milestones
└── README.md                # Repository master documentation
```

### Data Flow Diagram
```
[ Customer visits Site ]
         │
         ▼
[ 18+ Interactive Age Gate ] ── (Under 18) ──► [ Access Denied ]
         │ (Confirmed 18+)
         ▼
[ Browses Curated Catalog ]
         │
         ▼
[ Adds Items to Cart (localStorage) ]
         │
         ▼
[ Enters Name, BD Phone, Address ]
         │
         ▼
[ Selects Payment Structure ]
   ├── Full Advance (bKash Personal / Merchant)
   └── Hybrid Commitment (৳150 Advance Delivery Fee + Remainder COD)
         │
         ▼
[ Order Webhook Dispatch (Optional Ledger) ]
         │
         ▼
[ WhatsApp Handoff via URL Scheme ] ──► [ Babu Bhai / Tech Router ]
                                                │
                                                ▼
                                    [ Verification & Pathao Dispatch ]
```

---

## ⚡ Core Features

### 1. Hardened 18+ Age Gate & Lockout
Complies with tobacco control guidelines by requiring explicit, interactive age verification before rendering the catalog. If a visitor indicates they are under 18, access is permanently denied via persistent `sv_age_denied` storage and an uncompromising lockout screen preventing back-navigation or refresh bypass.

### 2. Hybrid Payment Protection (Advance Courier Fee + COD)
Addresses the high drop-off rate of 100% advance payments while eliminating Return-to-Origin (RTO) courier losses:
* **Advance Commitment Fee:** Customer sends ৳150 via bKash to confirm the order and cover delivery costs.
* **Cash on Delivery (COD):** The product balance is paid directly to the Pathao courier upon package delivery and inspection.

### 3. Transparent Pathao 1% COD Fee Accounting
Pathao courier charges a mandatory 1% Cash on Delivery collection fee when remitting customer cash. The system explicitly factors this fee (`dueOnDelivery * 0.01`) into checkout totals, backend order payloads, and owner settlement ledgers (`estimatedCodFee` and `estimatedMerchantNetPayout`) to prevent hidden margin leakage.

### 4. Dynamic Out-of-Stock Inventory Control
Product cards seamlessly reflect availability defined in `products.json` (`"inStock": false`):
* High-visibility **"স্টক আউট / Out of Stock"** ribbon badges on depleted items.
* Disabled action buttons with clear "Stock Out" status indicators.
* Client-side cart addition guards preventing depleted SKUs from entering the checkout funnel.

### 5. bKash Setup Mode Guard
Prevents real customers from sending money to unconfigured placeholders (e.g. `017XX-XXXXXX`):
* Detects placeholder masks and switches checkout to a safe "Setup Mode".
* Renders an explanatory warning banner (*"⚠️ পেমেন্ট নাম্বার সেটআপাধীন — WhatsApp এ কনফার্ম করে নাম্বার দেওয়া হবে"*).
* Blocks misleading copy-to-clipboard interactions on placeholder numbers.

### 6. Merchant Order Ledger & 1-Click Pathao Bulk CSV Export
Equips the New Market shop operator and digital partner with an in-browser management console:
* View all customer submissions locally stored in `localStorage.sv_orders` with full itemization, delivery address, and payment status.
* **1-Click Pathao CSV Export:** Instantly generates a formatted CSV ready for bulk parcel upload on the Pathao Merchant Web Dashboard (Merchant Order ID, Recipient Name, Recipient Phone, Recipient Address, COD Amount).

### 7. Fail-Safe WhatsApp Order Routing
* Generates structured, pre-formatted order summaries (bilingual Bangla/English).
* Includes product list, quantities, delivery address, selected payment method, and bKash transaction confirmation prompts.
* **Non-Destructive Cart State:** The cart is preserved until the user initiates the chat window, preventing loss of cart items due to browser popup blockers.

### 8. Zero-Dependency Light/Dark UI
* High-contrast, clean modern aesthetic built for mobile screens.
* Responsive cart drawer with instant quantity modifications and subtotal calculations.
* Pure vanilla implementation ensuring sub-second load times even on slow mobile connections.

---

## ⚙️ Configuration Guide (`config.js`)

Central operational settings, phone numbers, delivery pricing, and payment workflows are managed directly in `config.js`:

```javascript
// config.js — Master Application Settings
window.CONFIG = {
    // Store Identity & Branding
    storeName: "Safwan's Vape Shop BD",
    tagline: "Authentic Vapes & Pods — 100% Genuine & Sealed Guarantee",
    hubLocation: "New Market & Dhanmondi Delivery Hub, Dhaka",
    
    // Contact & WhatsApp Ordering
    whatsappNumber: "8801327045005",      // WhatsApp order destination (no leading +)
    supportPhoneDisplay: "01327-045005",   // Display string on UI
    
    // bKash Account (Send Money)
    bkashNumber: "017XX-XXXXXX",           // Shop Owner's bKash number (guarded against XX placeholders)
    
    // Logistics & Financial Rates
    pathaoCodFeeRate: 0.01,                // 1% Pathao Cash on Delivery collection fee
    bkashCashoutFeeRate: 0.0185,           // 1.85% personal bKash cashout fee benchmark

    // Order Logging Webhook (Optional Google Apps Script / Supabase)
    orderWebhookUrl: "", 

    // Delivery Options
    deliveryOptions: [
        { id: "inside_dhaka",  name: "Inside Dhaka (Pathao Express)", fee: 80,  eta: "1-2 Days" },
        { id: "outside_dhaka", name: "Outside Dhaka (Pathao Courier)", fee: 150, eta: "2-4 Days" },
        { id: "store_pickup",  name: "Store Pickup (New Market / Dhanmondi Hub)", fee: 0, eta: "Same Day" }
    ],

    // Payment Options (Hybrid Partial vs. Full Advance)
    paymentOptions: [
        {
            id: "hybrid",
            name: "Hybrid Partial Advance (Recommended)",
            advanceAmount: 150 // ৳150 delivery commitment fee via bKash, remainder COD
        },
        {
            id: "full",
            name: "Full Advance Payment",
            advanceAmount: null // 100% total amount via bKash Send Money
        }
    ]
};
```

---

## 💻 Local Development & Testing

No package managers (`npm`/`yarn`) or heavy build steps are required.

### 1. Clone Repository
```bash
git clone https://github.com/the-abraar/SafwansVapeShopBD.git
cd SafwansVapeShopBD
```

### 2. Run Local Development Server
Use any lightweight static server:

#### Using Python 3:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

#### Using Node.js `npx serve`:
```bash
npx serve .
```

#### Using VS Code:
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🚀 Deployment Guide

The static architecture allows frictionless deployment to any static hosting provider.

### Option A: GitHub Pages
1. Push your repository to GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, set Source to **Deploy from a branch**.
4. Select `main` branch and `/ (root)` folder.
5. Click **Save**. Your site will be live at `https://<username>.github.io/SafwansVapeShopBD/`.

### Option B: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel` (or connect via GitHub on vercel.com).
2. Run from project root:
   ```bash
   vercel --prod
   ```
3. Custom domain mapping: Configure DNS `CNAME` for your domain (e.g. `shop.blankframe.tech`).

### Option C: Cloudflare Pages
1. Connect GitHub repository to Cloudflare Pages.
2. Build command: *(leave empty)*.
3. Build output directory: `.` or `/`.
4. Deploy immediately with global CDN edge caching.

---

## 📦 Operational Guide for Shop Owner & Partner

Running the business requires continuous collaboration between the New Market shop and the tech lead.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      DAILY OPERATIONAL CYCLE                              │
├─────────────────────┬─────────────────────────────────────────────────────┤
│ 11:30 AM — Sync     │ Owner checks reserve shelf & reports any stock-outs │
│ 02:00 PM — Orders   │ WhatsApp orders received, bKash payments confirmed  │
│ 07:00 PM — Packing  │ Shop owner packs devices in sealed bubble envelopes │
│ 08:00 PM — Dispatch │ Pathao rider picks up packages from New Market      │
│ 10:00 PM — Ledger   │ Daily orders reconciled against Pathao tracking IDs │
└─────────────────────┴─────────────────────────────────────────────────────┘
```

### Shop Owner Checklist (Babu Bhai & Safwan)
1. **Dedicated Online Shelf:** Reserve 2 units of each active kit in a separate box inside the store. Do not sell these to walk-in customers.
2. **Package Quality:** Pack only unopened, factory-sealed boxes with visible holographic authenticity codes.
3. **Dispatch Confirmation:** Once Pathao collects the package, take a picture of the consignment tracking slip and send it to the customer via WhatsApp.

### Tech Partner Checklist (Abrar / Operations)
1. **Order Routing:** Verify customer WhatsApp message details, ensure bKash transaction screenshot is valid, and forward the ready packing list to Babu Bhai.
2. **Inventory Toggles:** Update `products.json` or `index.html` immediately if Babu Bhai reports an item is low or out of stock.
3. **Weekly Reconciliation:** Reconcile all delivered orders, cashouts, and courier fees every Friday.

---

## ⚖️ Legal & Regulatory Compliance Notice

* **Age Restriction:** Sales are strictly restricted to individuals aged 18 and older. Underage use is prohibited.
* **Platform Disclaimer:** This website serves exclusively as a digital ordering interface for a licensed physical retail establishment in Dhaka.
* **Regulatory Landscape:** E-cigarette products in Bangladesh are subject to ongoing regulatory proceedings under the *Smoking and Tobacco Products Usage (Control) Act, 2005* and associated amendments. All commercial participants must maintain active Dhaka City Corporation Trade Licenses and comply with local commercial ordinances.
* For a detailed legal risk assessment and owner requirements, refer to [`for_owner_blocked.md`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/for_owner_blocked.md).

---

## 📚 Documentation Directory

* **[`for_owner_blocked.md`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/for_owner_blocked.md)** — Comprehensive analysis of non-code business, legal, financial, and inventory blockers requiring owner resolution.
* **[`issues.md`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/issues.md)** — In-depth architectural review and technical critique of the codebase.
* **[`init_idea.md`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/init_idea.md)** — Initial concept, unit economics, and customer journey.
* **[`todo.md`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/todo.md)** — Project roadmap and actionable task status.
* **[`emails/`](file:///Users/blackbird/Everything/dev/SafwansVapeShopBD/emails)** — Official trade, legal, and supplier outreach records.