/**
 * Safwan's Vape Shop BD - Configuration
 * Centralized settings, delivery pricing, payment modes, and WhatsApp routing.
 */

window.CONFIG = {
    // Store Identity
    storeName: "Safwan's Vape Shop BD",
    tagline: "Authentic Vapes & Pods — 100% Genuine & Sealed Guarantee",
    hubLocation: "New Market & Dhanmondi Delivery Hub, Dhaka",
    
    // Contact & WhatsApp Ordering
    // Note: Configure these numbers for production order routing
    whatsappNumber: "8801327045005",
    supportPhoneDisplay: "01327-045005",
    
    // bKash Account (Send Money)
    // Update with shop owner's personal bKash number prior to public launch
    bkashNumber: "017XX-XXXXXX", 

    // Operational Fee Benchmarks (Issues 2.3, 2.5)
    pathaoCodFeeRate: 0.01, // Pathao 1% COD collection charge
    bkashCashoutFeeRate: 0.0185, // 1.85% personal bKash cashout fee benchmark

    // Helper to detect if bKash number is still an unconfigured placeholder (e.g. contains 'XX')
    isBkashPlaceholder: function() {
        return typeof this.bkashNumber === 'string' && /xx/i.test(this.bkashNumber);
    },
    
    // Order Logging Webhook (Roadmap 4)
    // If provided, order payloads are asynchronously posted here (e.g. Google Sheets Apps Script, Supabase edge function)
    orderWebhookUrl: "", 

    // Authenticity Trust Note
    authenticityGuarantee: "100% Factory Sealed • Scratch-off Verification Code • Importer Authenticated",

    // Delivery Options (Issue 4.4 & Roadmap 3)
    deliveryOptions: [
        {
            id: "inside_dhaka",
            name: "Inside Dhaka (Pathao Express)",
            fee: 80,
            eta: "1-2 Days",
            description: "Direct doorstep delivery across all Dhaka metro zones"
        },
        {
            id: "outside_dhaka",
            name: "Outside Dhaka (Pathao Courier)",
            fee: 150,
            eta: "2-4 Days",
            description: "Secure district courier delivery all over Bangladesh"
        },
        {
            id: "store_pickup",
            name: "Store Pickup (New Market / Dhanmondi Hub)",
            fee: 0,
            eta: "Same Day (Ready in 2h)",
            description: "Pick up in person directly from our shop counter with zero courier charge"
        }
    ],

    // Payment Options (Issue 4.4 & Roadmap 3)
    paymentOptions: [
        {
            id: "hybrid",
            name: "Hybrid Partial Advance (Recommended)",
            badge: "Most Popular",
            advanceType: "fixed",
            advanceAmount: 150, // ৳150 delivery & reservation commitment fee via bKash
            description: "Pay ৳150 commitment fee via bKash; pay the remaining balance Cash on Delivery (COD) to Pathao upon receiving."
        },
        {
            id: "full",
            name: "Full Advance Payment",
            badge: "Fast Track",
            advanceType: "full",
            advanceAmount: null, // 100% of order total
            description: "Pay 100% total amount via bKash Send Money before dispatch for express contactless handover."
        }
    ]
};

// Fallback Product Catalog (used if fetch('products.json') is blocked by file:// CORS)
window.FALLBACK_PRODUCTS = [
    {
        id: 1,
        name: "Uwell Caliburn G3 Pod Kit",
        category: "Pod System",
        desc: "Next-gen Caliburn with integrated coil cartridge, OLED display, and dual firing mechanism.",
        specs: ["900mAh Battery", "2.5ml Top-Fill", "OLED Screen", "0.6Ω / 0.9Ω Mesh"],
        price: 3050,
        badge: "100% Genuine Sealed",
        color: "#06b6d4",
        bgGradient: "linear-gradient(135deg, #09203f 0%, #1e3c72 100%)",
        svgType: "caliburn-g3",
        inStock: true
    },
    {
        id: 2,
        name: "Vaporesso XROS 3 Pod Kit",
        category: "Pod System",
        desc: "Precision airflow slider, AXON chip pulse mode, and SSS leak-resistant tech for unmatched flavor.",
        specs: ["1000mAh Battery", "AXON Pulse Mode", "Neon Battery Indicator", "Top Clamshell Fill"],
        price: 3250,
        badge: "Authentic Sealed",
        color: "#3b82f6",
        bgGradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
        svgType: "xros-3",
        inStock: true
    },
    {
        id: 3,
        name: "OXVA Xlim Pro Pod Kit",
        category: "Pro Pod Mod",
        desc: "Flagship 30W pro pod kit with dazzling RGB light glow, 0.42\" OLED screen, and top-fill anti-leak pods.",
        specs: ["30W Max Output", "1000mAh Battery", "RGB Glow Lighting", "0.42\" OLED Display"],
        price: 3550,
        badge: "Top Seller • Verified",
        color: "#8b5cf6",
        bgGradient: "linear-gradient(135deg, #1f1c2c 0%, #302b63 100%)",
        svgType: "oxva-xlim-pro",
        inStock: true
    },
    {
        id: 4,
        name: "RELX Infinity 2 Device",
        category: "Closed Pod",
        desc: "Ultra-ergonomic aluminum unibody with 3-level power adjustment and ultra-fast charging.",
        specs: ["3 Power Modes", "SuperFast USB-C", "SmartPace Vibration", "Leak-Resistant Maze"],
        price: 2050,
        badge: "100% Genuine",
        color: "#ec4899",
        bgGradient: "linear-gradient(135deg, #200122 0%, #3c093a 100%)",
        svgType: "relx-infinity-2",
        inStock: true
    },
    {
        id: 5,
        name: "VGOD SaltNic Dry Tobacco 30ml",
        category: "Salt Nicotine",
        desc: "Authentic cured American tobacco aroma with a smooth, robust throat hit. USA formulated.",
        specs: ["30ml Chubby Bottle", "25mg / 50mg", "USA Authentic Batch", "Child-Proof Cap"],
        price: 1550,
        badge: "Original USA Batch",
        color: "#f59e0b",
        bgGradient: "linear-gradient(135deg, #2c1b0a 0%, #4a2f13 100%)",
        svgType: "vgod-salts",
        inStock: true
    },
    {
        id: 6,
        name: "Caliburn G3 Replacement Pods (4-Pack)",
        category: "Coils & Pods",
        desc: "Official Uwell replacement cartridges featuring Pro-FOCS flavor technology and ultrasonic welding.",
        specs: ["Pack of 4 Pods", "0.6Ω or 0.9Ω", "2.5ml Capacity", "Magnetic Connection"],
        price: 1250,
        badge: "Factory Sealed 4-Pack",
        color: "#10b981",
        bgGradient: "linear-gradient(135deg, #06281c 0%, #0d4a36 100%)",
        svgType: "caliburn-g3-pods",
        inStock: true
    }
];
