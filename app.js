/**
 * Safwan's Vape Shop BD — Core Application Logic
 * Decoupled state management, safe DOM rendering, age gate, hybrid checkout, and order ledger.
 */

(function () {
    'use strict';

    // =========================================================================
    // STATE & VARIABLES
    // =========================================================================
    let products = [];
    let cart = [];
    let currentSelectedDelivery = null;
    let currentSelectedPayment = null;
    let lastGeneratedOrder = null;

    // Load cart safely
    try {
        const storedCart = localStorage.getItem('sv_cart');
        if (storedCart) cart = JSON.parse(storedCart);
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        console.warn('Could not parse stored cart:', e);
        cart = [];
    }

    // =========================================================================
    // UTILITIES & SECURITY (Issue 3.5: DOM XSS Prevention)
    // =========================================================================
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatBDT(amount) {
        return '৳' + Number(amount || 0).toLocaleString('en-US');
    }

    // Modern Toast Notification (Issue 3.4: Replaces alert())
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 3800);
    }

    // Phone Normalizer & Bangladeshi Validator (Issue 3.4)
    function validateBangladeshiPhone(rawPhone) {
        if (!rawPhone) return { valid: false, normalized: '' };
        // Remove spaces, hyphens, parens
        let clean = rawPhone.replace(/[\s\-\(\)]/g, '');
        // Strip leading +88 or 88 if present
        if (clean.startsWith('+88')) clean = clean.slice(3);
        else if (clean.startsWith('88')) clean = clean.slice(2);
        
        // Match Bangladeshi mobile operators: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
        const bdRegex = /^01[3-9]\d{8}$/;
        const isValid = bdRegex.test(clean);
        return { valid: isValid, normalized: clean };
    }

    // =========================================================================
    // PRODUCT SVG ARTWORK GENERATOR (Issue 4.1: Modern visual representations)
    // =========================================================================
    function getProductSvg(svgType, color) {
        switch (svgType) {
            case 'caliburn-g3':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bodyG3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#334155"/>
                            <stop offset="50%" stop-color="#1e293b"/>
                            <stop offset="100%" stop-color="#0f172a"/>
                        </linearGradient>
                        <linearGradient id="podG3" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#475569" stop-opacity="0.8"/>
                            <stop offset="100%" stop-color="#1e293b" stop-opacity="0.95"/>
                        </linearGradient>
                        <filter id="glowG3" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${color}" flood-opacity="0.6"/>
                        </filter>
                    </defs>
                    <!-- Pod Mouthpiece -->
                    <path d="M68 20 C68 15, 92 15, 92 20 L94 40 L66 40 Z" fill="url(#podG3)" stroke="#64748b" stroke-width="1.5"/>
                    <rect x="73" y="24" width="14" height="6" rx="2" fill="#0f172a"/>
                    <!-- Juice Window -->
                    <rect x="71" y="40" width="18" height="8" rx="2" fill="#0284c7" fill-opacity="0.7" stroke="#38bdf8" stroke-width="0.8"/>
                    <!-- Device Body -->
                    <rect x="62" y="48" width="36" height="96" rx="6" fill="url(#bodyG3)" stroke="#475569" stroke-width="1.5"/>
                    <!-- Metallic Chamfer Lines -->
                    <line x1="66" y1="52" x2="66" y2="138" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                    <line x1="94" y1="52" x2="94" y2="138" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
                    <!-- OLED Screen -->
                    <rect x="68" y="62" width="24" height="30" rx="3" fill="#050811" stroke="#334155" stroke-width="1"/>
                    <text x="80" y="74" fill="#38bdf8" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">15W</text>
                    <rect x="72" y="78" width="16" height="3" rx="1" fill="#22c55e"/>
                    <text x="80" y="88" fill="#94a3b8" font-size="6" font-family="monospace" text-anchor="middle">0.6Ω</text>
                    <!-- Fire Button with Glow -->
                    <circle cx="80" cy="104" r="6" fill="#1e293b" stroke="${color}" stroke-width="1.5" filter="url(#glowG3)"/>
                    <circle cx="80" cy="104" r="2.5" fill="${color}"/>
                    <!-- Logo & Indicator -->
                    <text x="80" y="125" fill="#64748b" font-size="5" font-weight="700" letter-spacing="1" text-anchor="middle">CALIBURN</text>
                    <rect x="76" y="132" width="8" height="2" rx="1" fill="#38bdf8" opacity="0.8"/>
                </svg>`;

            case 'xros-3':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bodyXros" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1e3a8a"/>
                            <stop offset="50%" stop-color="#172554"/>
                            <stop offset="100%" stop-color="#0f172a"/>
                        </linearGradient>
                        <linearGradient id="neonLight" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#06b6d4"/>
                            <stop offset="50%" stop-color="#3b82f6"/>
                            <stop offset="100%" stop-color="#a855f7"/>
                        </linearGradient>
                        <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#38bdf8" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <!-- Top Clamshell Pod -->
                    <path d="M69 18 C69 14, 91 14, 91 18 L93 42 L67 42 Z" fill="#334155" fill-opacity="0.85" stroke="#64748b" stroke-width="1.5"/>
                    <rect x="74" y="24" width="12" height="14" rx="2" fill="#0284c7" opacity="0.6"/>
                    <line x1="80" y1="26" x2="80" y2="36" stroke="#f8fafc" stroke-width="1.5"/>
                    <!-- Aluminum Main Body -->
                    <rect x="63" y="42" width="34" height="102" rx="5" fill="url(#bodyXros)" stroke="#3b82f6" stroke-width="1.2"/>
                    <!-- Diamond Texture Pattern Overlay -->
                    <rect x="67" y="50" width="26" height="52" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" stroke-width="0.8"/>
                    <!-- Firing Button -->
                    <circle cx="80" cy="74" r="5.5" fill="#0f172a" stroke="#60a5fa" stroke-width="1.2"/>
                    <circle cx="80" cy="74" r="2" fill="#93c5fd"/>
                    <!-- Vaporesso AXON Chip Badge -->
                    <text x="80" y="116" fill="#94a3b8" font-size="5.5" font-weight="800" letter-spacing="1.5" text-anchor="middle">VAPORESSO</text>
                    <!-- Neon Indicator Bar -->
                    <rect x="70" y="130" width="20" height="3" rx="1.5" fill="url(#neonLight)" filter="url(#neonGlow)"/>
                </svg>`;

            case 'oxva-xlim-pro':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bodyOxva" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#4c1d95"/>
                            <stop offset="50%" stop-color="#2e1065"/>
                            <stop offset="100%" stop-color="#090514"/>
                        </linearGradient>
                        <linearGradient id="rgbBar" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#ec4899"/>
                            <stop offset="50%" stop-color="#8b5cf6"/>
                            <stop offset="100%" stop-color="#06b6d4"/>
                        </linearGradient>
                        <filter id="rgbGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#a855f7" flood-opacity="0.9"/>
                        </filter>
                    </defs>
                    <!-- Anti-leak Pod -->
                    <path d="M68 22 C68 17, 92 17, 92 22 L94 44 L66 44 Z" fill="#3b0764" fill-opacity="0.8" stroke="#7e22ce" stroke-width="1.5"/>
                    <rect x="73" y="27" width="14" height="12" rx="2" fill="#a855f7" opacity="0.4"/>
                    <!-- Zinc Alloy Frame -->
                    <rect x="61" y="44" width="38" height="98" rx="7" fill="url(#bodyOxva)" stroke="#a855f7" stroke-width="1.5"/>
                    <!-- Carbon/Glitter Inlay Panel -->
                    <rect x="66" y="50" width="28" height="84" rx="4" fill="#180b2d" stroke="rgba(168,85,247,0.3)" stroke-width="1"/>
                    <!-- 0.42" OLED Screen -->
                    <rect x="69" y="58" width="22" height="24" rx="2" fill="#000" stroke="#4c1d95" stroke-width="0.8"/>
                    <text x="80" y="68" fill="#e879f9" font-size="7" font-weight="900" font-family="monospace" text-anchor="middle">22W</text>
                    <text x="80" y="77" fill="#c084fc" font-size="5" font-family="monospace" text-anchor="middle">0.6Ω 98%</text>
                    <!-- Glowing RGB Light Strip -->
                    <rect x="69" y="87" width="22" height="4" rx="2" fill="url(#rgbBar)" filter="url(#rgbGlow)"/>
                    <!-- Side Airflow & Fire Button -->
                    <circle cx="80" cy="105" r="5" fill="#2e1065" stroke="#c084fc" stroke-width="1.2"/>
                    <text x="80" y="124" fill="#a855f7" font-size="6" font-weight="800" letter-spacing="1" text-anchor="middle">OXVA</text>
                </svg>`;

            case 'relx-infinity-2':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bodyRelx" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#262626"/>
                            <stop offset="50%" stop-color="#171717"/>
                            <stop offset="100%" stop-color="#0a0a0a"/>
                        </linearGradient>
                    </defs>
                    <!-- Pod -->
                    <path d="M70 20 C70 16, 90 16, 90 20 L92 46 L68 46 Z" fill="#262626" stroke="#525252" stroke-width="1.5"/>
                    <ellipse cx="80" cy="22" rx="6" ry="2" fill="#171717"/>
                    <!-- Ergonomic Pill Unibody -->
                    <rect x="65" y="46" width="30" height="98" rx="15" fill="url(#bodyRelx)" stroke="#404040" stroke-width="1.5"/>
                    <!-- Smart Ring LED Indicator -->
                    <circle cx="80" cy="86" r="7" fill="none" stroke="#ec4899" stroke-width="1.5"/>
                    <circle cx="80" cy="86" r="2.5" fill="#f43f5e"/>
                    <!-- 3 Mode Indicator Dots -->
                    <circle cx="76" cy="99" r="1.2" fill="#10b981"/>
                    <circle cx="80" cy="99" r="1.2" fill="#3b82f6"/>
                    <circle cx="84" cy="99" r="1.2" fill="#ec4899"/>
                    <!-- Minimalist Logo -->
                    <text x="80" y="126" fill="#737373" font-size="6" font-weight="700" letter-spacing="2" text-anchor="middle">RELX</text>
                </svg>`;

            case 'vgod-salts':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#78350f"/>
                            <stop offset="50%" stop-color="#451a03"/>
                            <stop offset="100%" stop-color="#1c0a00"/>
                        </linearGradient>
                        <linearGradient id="labelGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#f59e0b"/>
                            <stop offset="100%" stop-color="#b45309"/>
                        </linearGradient>
                    </defs>
                    <!-- Dropper Cap -->
                    <rect x="74" y="16" width="12" height="12" rx="2" fill="#1c1917" stroke="#44403c" stroke-width="1.2"/>
                    <rect x="71" y="28" width="18" height="6" rx="1.5" fill="#292524" stroke="#44403c" stroke-width="1"/>
                    <!-- Bottle Neck & Shoulder -->
                    <path d="M72 34 L88 34 L94 48 L66 48 Z" fill="#451a03" stroke="#78350f" stroke-width="1"/>
                    <!-- Bottle Main Cylinder -->
                    <rect x="62" y="48" width="36" height="96" rx="8" fill="url(#bottleGrad)" stroke="#92400e" stroke-width="1.5"/>
                    <!-- Label Area -->
                    <rect x="63" y="60" width="34" height="68" fill="#18181b" stroke="url(#labelGold)" stroke-width="1"/>
                    <!-- Label Design -->
                    <rect x="66" y="64" width="28" height="10" fill="url(#labelGold)" rx="1"/>
                    <text x="80" y="72" fill="#000" font-size="6" font-weight="900" font-family="sans-serif" text-anchor="middle">VGOD</text>
                    <text x="80" y="82" fill="#fbbf24" font-size="5" font-weight="800" text-anchor="middle">SALTNIC</text>
                    <text x="80" y="90" fill="#f8fafc" font-size="4.5" font-weight="600" text-anchor="middle">DRY TOBACCO</text>
                    <line x1="68" y1="96" x2="92" y2="96" stroke="#78350f" stroke-width="0.8"/>
                    <text x="80" y="104" fill="#cbd5e1" font-size="4.5" font-family="monospace" text-anchor="middle">30ML • 50MG</text>
                    <text x="80" y="118" fill="#eab308" font-size="4" font-weight="700" text-anchor="middle">USA FORMULA</text>
                </svg>`;

            case 'caliburn-g3-pods':
                return `
                <svg viewBox="0 0 160 160" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="podCartridge" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#334155" stop-opacity="0.9"/>
                            <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
                        </linearGradient>
                    </defs>
                    <!-- Blister 4-Pack Badge Background -->
                    <rect x="52" y="32" width="56" height="96" rx="8" fill="#064e3b" fill-opacity="0.3" stroke="#059669" stroke-width="1.5" stroke-dasharray="4 2"/>
                    <!-- Cartridge 1 -->
                    <rect x="60" y="40" width="40" height="38" rx="5" fill="url(#podCartridge)" stroke="#10b981" stroke-width="1.2"/>
                    <rect x="68" y="44" width="24" height="6" rx="2" fill="#0f172a"/>
                    <circle cx="80" cy="59" r="6" fill="#047857" stroke="#34d399" stroke-width="1"/>
                    <text x="80" y="62" fill="#fff" font-size="5" font-weight="bold" font-family="monospace" text-anchor="middle">0.6Ω</text>
                    <!-- Gold Contact Pins -->
                    <circle cx="73" cy="74" r="2" fill="#eab308"/>
                    <circle cx="87" cy="74" r="2" fill="#eab308"/>
                    <!-- Cartridge 2 (Shadow/Pack indication) -->
                    <rect x="60" y="82" width="40" height="38" rx="5" fill="url(#podCartridge)" stroke="#10b981" stroke-width="1.2"/>
                    <rect x="68" y="86" width="24" height="6" rx="2" fill="#0f172a"/>
                    <circle cx="80" cy="101" r="6" fill="#047857" stroke="#34d399" stroke-width="1"/>
                    <text x="80" y="104" fill="#fff" font-size="5" font-weight="bold" font-family="monospace" text-anchor="middle">0.9Ω</text>
                    <circle cx="73" cy="116" r="2" fill="#eab308"/>
                    <circle cx="87" cy="116" r="2" fill="#eab308"/>
                    <!-- 4PCS Badge -->
                    <rect x="94" y="24" width="26" height="12" rx="3" fill="#10b981"/>
                    <text x="107" y="32.5" fill="#022c22" font-size="6" font-weight="900" text-anchor="middle">4-PACK</text>
                </svg>`;

            default:
                return `
                <svg viewBox="0 0 160 160" width="100" height="100" fill="none">
                    <circle cx="80" cy="80" r="40" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2"/>
                    <text x="80" y="86" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">VAPE</text>
                </svg>`;
        }
    }

    // =========================================================================
    // PRODUCT CATALOG LOADER (Decoupled JSON with Fallback)
    // =========================================================================
    async function loadProducts() {
        try {
            const res = await fetch('products.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            products = await res.json();
        } catch (err) {
            console.info('Fetch from products.json failed or restricted (e.g. file:// protocol), using window.FALLBACK_PRODUCTS:', err.message);
            if (window.FALLBACK_PRODUCTS && Array.isArray(window.FALLBACK_PRODUCTS)) {
                products = window.FALLBACK_PRODUCTS;
            } else {
                products = [];
            }
        }
        renderProducts();
        updateCartUI();
    }

    // Render Product Cards
    function renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        grid.innerHTML = '';

        products.forEach(p => {
            const isOutOfStock = p.inStock === false;
            const card = document.createElement('div');
            card.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;

            const specsHtml = (p.specs || []).map(s => `<span class="spec-pill">${escapeHTML(s)}</span>`).join('');

            const stockTagHtml = isOutOfStock
                ? `<div class="product-stock-tag out-of-stock">
                        <i class="fa-solid fa-ban"></i> স্টক আউট / Out of Stock
                   </div>`
                : `<div class="product-stock-tag">
                        <i class="fa-solid fa-check"></i> In Stock
                   </div>`;

            const buttonHtml = isOutOfStock
                ? `<button class="add-btn" data-id="${p.id}" disabled aria-disabled="true">
                        <i class="fa-solid fa-ban"></i> স্টক শেষ / Stock Out
                   </button>`
                : `<button class="add-btn" data-id="${p.id}">
                        <i class="fa-solid fa-plus"></i> Add to Bag
                   </button>`;

            card.innerHTML = `
                <div class="product-art-container" style="background: ${p.bgGradient || 'rgba(255,255,255,0.02)'};">
                    <div class="product-art-badge">
                        <i class="fa-solid fa-certificate"></i> ${escapeHTML(p.badge || '100% Genuine')}
                    </div>
                    <div class="product-svg-art">
                        ${getProductSvg(p.svgType, p.color)}
                    </div>
                    ${stockTagHtml}
                </div>
                <div class="product-body">
                    <span class="product-cat">${escapeHTML(p.category)}</span>
                    <h3 class="product-name">${escapeHTML(p.name)}</h3>
                    <div class="specs-list">${specsHtml}</div>
                    <p class="product-desc">${escapeHTML(p.desc)}</p>
                    <div class="product-footer">
                        <div class="product-price">
                            ${formatBDT(p.price)} <small>BDT</small>
                        </div>
                        ${buttonHtml}
                    </div>
                </div>
            `;

            // Event listener for Add Button
            const addBtn = card.querySelector('.add-btn');
            if (addBtn && !isOutOfStock) {
                addBtn.addEventListener('click', () => addToCart(p.id));
            }

            grid.appendChild(card);
        });
    }

    // =========================================================================
    // CART MANAGEMENT
    // =========================================================================
    function addToCart(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;

        // Out of Stock Guard (Issue 2.6)
        if (p.inStock === false) {
            showToast('Sorry, this item is currently out of stock.', 'error');
            return;
        }

        const existing = cart.find(x => x.id === id);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                color: p.color,
                svgType: p.svgType,
                qty: 1
            });
        }

        saveCart();
        updateCartUI();
        openCartPanel();
        showToast(`Added ${p.name} to bag!`, 'success');
    }

    function removeFromCart(id) {
        const item = cart.find(x => x.id === id);
        cart = cart.filter(x => x.id !== id);
        saveCart();
        updateCartUI();
        if (item) showToast(`Removed ${item.name}`, 'info');
    }

    function changeQty(id, delta) {
        const item = cart.find(x => x.id === id);
        if (!item) return;

        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }

    function saveCart() {
        try {
            localStorage.setItem('sv_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
    }

    function clearCart() {
        cart = [];
        saveCart();
        updateCartUI();
    }

    function getCartSubtotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    function updateCartUI() {
        const badge = document.getElementById('cart-badge');
        const body = document.getElementById('cart-body');
        const empty = document.getElementById('cart-empty');
        const totalEl = document.getElementById('cart-total');
        const btn = document.getElementById('checkout-btn');

        const totalItemsCount = cart.reduce((sum, i) => sum + i.qty, 0);

        if (badge) {
            badge.textContent = totalItemsCount;
            badge.dataset.count = totalItemsCount;
            badge.style.display = totalItemsCount > 0 ? 'flex' : 'none';

            // Pulse animation
            badge.classList.remove('pulse');
            void badge.offsetWidth;
            badge.classList.add('pulse');
        }

        const subtotal = getCartSubtotal();
        if (totalEl) totalEl.textContent = formatBDT(subtotal);
        const grandTotalEl = document.getElementById('cart-grand-total');
        if (grandTotalEl) grandTotalEl.textContent = formatBDT(subtotal);
        if (btn) btn.disabled = cart.length === 0;

        // Clear existing items in cart body except empty state placeholder
        if (body) {
            body.querySelectorAll('.cart-item').forEach(el => el.remove());

            if (cart.length === 0) {
                if (empty) empty.style.display = 'block';
            } else {
                if (empty) empty.style.display = 'none';

                cart.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'cart-item';

                    el.innerHTML = `
                        <div class="cart-item-preview">
                            ${getProductSvg(item.svgType, item.color)}
                        </div>
                        <div class="cart-item-info">
                            <div class="cart-item-name">${escapeHTML(item.name)}</div>
                            <div class="cart-item-price">${formatBDT(item.price * item.qty)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <button class="qty-btn btn-minus" aria-label="Decrease quantity">−</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-btn btn-plus" aria-label="Increase quantity">+</button>
                        </div>
                        <button class="cart-item-remove" aria-label="Remove item" title="Remove">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;

                    el.querySelector('.btn-minus').addEventListener('click', () => changeQty(item.id, -1));
                    el.querySelector('.btn-plus').addEventListener('click', () => changeQty(item.id, 1));
                    el.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(item.id));

                    body.appendChild(el);
                });
            }
        }
    }

    // =========================================================================
    // CART PANEL DRAWER
    // =========================================================================
    function openCartPanel() {
        const overlay = document.getElementById('cart-overlay');
        const panel = document.getElementById('cart-panel');
        if (overlay && panel) {
            overlay.classList.add('open');
            panel.classList.add('open');
        }
    }

    function closeCartPanel() {
        const overlay = document.getElementById('cart-overlay');
        const panel = document.getElementById('cart-panel');
        if (overlay && panel) {
            overlay.classList.remove('open');
            panel.classList.remove('open');
        }
    }

    function toggleCart() {
        const panel = document.getElementById('cart-panel');
        if (panel && panel.classList.contains('open')) {
            closeCartPanel();
        } else {
            openCartPanel();
        }
    }

    // =========================================================================
    // CHECKOUT MODAL & DYNAMIC PRICING (Issue 4.4 & Roadmap 3)
    // =========================================================================
    function renderDeliveryOptions() {
        const container = document.getElementById('delivery-options-container');
        if (!container || !window.CONFIG || !window.CONFIG.deliveryOptions) return;

        container.innerHTML = '';
        const options = window.CONFIG.deliveryOptions;

        if (!currentSelectedDelivery) {
            currentSelectedDelivery = options[0]; // Default to Inside Dhaka
        }

        options.forEach(opt => {
            const isSelected = currentSelectedDelivery.id === opt.id;
            const card = document.createElement('label');
            card.className = `option-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <input type="radio" name="delivery_option" value="${escapeHTML(opt.id)}" ${isSelected ? 'checked' : ''}>
                <div class="option-content">
                    <div class="option-header-row">
                        <span class="option-name">${escapeHTML(opt.name)}</span>
                        <span class="option-fee">${opt.fee === 0 ? 'FREE' : formatBDT(opt.fee)}</span>
                    </div>
                    <div class="option-desc">${escapeHTML(opt.description)} • <em>ETA: ${escapeHTML(opt.eta)}</em></div>
                </div>
            `;

            card.querySelector('input').addEventListener('change', () => {
                currentSelectedDelivery = opt;
                container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                recalculateCheckoutTotals();
            });

            container.appendChild(card);
        });
    }

    function renderPaymentOptions() {
        const container = document.getElementById('payment-options-container');
        if (!container || !window.CONFIG || !window.CONFIG.paymentOptions) return;

        container.innerHTML = '';
        const options = window.CONFIG.paymentOptions;

        if (!currentSelectedPayment) {
            currentSelectedPayment = options[0]; // Default to Hybrid Partial Advance
        }

        options.forEach(opt => {
            const isSelected = currentSelectedPayment.id === opt.id;
            const card = document.createElement('label');
            card.className = `option-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <input type="radio" name="payment_option" value="${escapeHTML(opt.id)}" ${isSelected ? 'checked' : ''}>
                <div class="option-content">
                    <div class="option-header-row">
                        <span class="option-name">${escapeHTML(opt.name)}</span>
                        ${opt.badge ? `<span class="option-badge">${escapeHTML(opt.badge)}</span>` : ''}
                    </div>
                    <div class="option-desc">${escapeHTML(opt.description)}</div>
                </div>
            `;

            card.querySelector('input').addEventListener('change', () => {
                currentSelectedPayment = opt;
                container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                recalculateCheckoutTotals();
            });

            container.appendChild(card);
        });
    }

    function recalculateCheckoutTotals() {
        const subtotal = getCartSubtotal();
        const deliveryFee = currentSelectedDelivery ? currentSelectedDelivery.fee : 0;
        const grandTotal = subtotal + deliveryFee;

        let advancePayable = 0;
        let dueOnDelivery = 0;

        if (currentSelectedPayment && currentSelectedPayment.id === 'hybrid') {
            // For store pickup, delivery fee is 0 and full cash/bKash is possible on counter
            if (currentSelectedDelivery && currentSelectedDelivery.id === 'store_pickup') {
                advancePayable = 0;
                dueOnDelivery = grandTotal;
            } else {
                // Fixed ৳150 commitment & courier advance
                advancePayable = Math.min(window.CONFIG.paymentOptions[0].advanceAmount || 150, grandTotal);
                dueOnDelivery = Math.max(0, grandTotal - advancePayable);
            }
        } else {
            // Full Advance
            advancePayable = grandTotal;
            dueOnDelivery = 0;
        }

        // Pathao 1% COD Fee & Net Merchant Payout Calculation (Issue 2.5)
        const codRate = (window.CONFIG && window.CONFIG.pathaoCodFeeRate) || 0.01;
        const codFee = Math.round(dueOnDelivery * codRate);
        const netMerchantPayout = dueOnDelivery - codFee;

        // Update breakdown elements
        const subtotalEl = document.getElementById('calc-subtotal');
        const deliveryEl = document.getElementById('calc-delivery');
        const grandTotalEl = document.getElementById('calc-grand-total');
        const advanceEl = document.getElementById('calc-advance');
        const codEl = document.getElementById('calc-cod');
        const bkashAmountEl = document.getElementById('modal-bkash-amount');

        if (subtotalEl) subtotalEl.textContent = formatBDT(subtotal);
        if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : formatBDT(deliveryFee);
        if (grandTotalEl) grandTotalEl.textContent = formatBDT(grandTotal);
        if (advanceEl) advanceEl.textContent = formatBDT(advancePayable);
        if (codEl) codEl.textContent = formatBDT(dueOnDelivery);
        if (bkashAmountEl) bkashAmountEl.textContent = formatBDT(advancePayable);

        return {
            subtotal,
            deliveryFee,
            grandTotal,
            advancePayable,
            dueOnDelivery,
            codFee,
            netMerchantPayout
        };
    }

    function openCheckout() {
        if (cart.length === 0) {
            showToast('Your bag is empty! Add products first.', 'error');
            return;
        }

        closeCartPanel();

        renderDeliveryOptions();
        renderPaymentOptions();
        recalculateCheckoutTotals();

        // Populate bKash Number in display & Check placeholder guard (Issue 2.3)
        const bkashNumEl = document.getElementById('bkash-number-display');
        const bkashWarningEl = document.getElementById('bkash-warning-banner');
        const isPlaceholder = window.CONFIG && (typeof window.CONFIG.isBkashPlaceholder === 'function'
            ? window.CONFIG.isBkashPlaceholder()
            : /xx/i.test(window.CONFIG.bkashNumber || ''));

        if (bkashNumEl && window.CONFIG) {
            bkashNumEl.textContent = window.CONFIG.bkashNumber || '017XX-XXXXXX';
        }
        if (bkashWarningEl) {
            bkashWarningEl.style.display = isPlaceholder ? 'flex' : 'none';
        }

        const modal = document.getElementById('checkout-modal');
        if (modal) modal.classList.add('open');
    }

    function closeCheckout() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.classList.remove('open');
    }

    // =========================================================================
    // SUBMIT ORDER (Fix Issue 3.3 Flow Bug & Roadmap 4 Ledger/Webhook)
    // =========================================================================
    function submitOrder() {
        const nameInput = document.getElementById('f-name');
        const phoneInput = document.getElementById('f-phone');
        const addressInput = document.getElementById('f-address');

        const nameError = document.getElementById('name-error');
        const phoneError = document.getElementById('phone-error');
        const addressError = document.getElementById('address-error');

        // Reset errors
        [nameInput, phoneInput, addressInput].forEach(el => el && el.classList.remove('input-error'));
        [nameError, phoneError, addressError].forEach(el => el && el.classList.remove('visible'));

        const name = (nameInput ? nameInput.value : '').trim();
        const rawPhone = (phoneInput ? phoneInput.value : '').trim();
        let address = (addressInput ? addressInput.value : '').trim();

        let hasError = false;

        // Name Validation
        if (!name || name.length < 3) {
            if (nameInput) nameInput.classList.add('input-error');
            if (nameError) {
                nameError.textContent = 'Please enter your full name (minimum 3 characters).';
                nameError.classList.add('visible');
            }
            hasError = true;
        }

        // Phone Validation (Bangladeshi Mobile Format)
        const phoneCheck = validateBangladeshiPhone(rawPhone);
        if (!phoneCheck.valid) {
            if (phoneInput) phoneInput.classList.add('input-error');
            if (phoneError) {
                phoneError.textContent = 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).';
                phoneError.classList.add('visible');
            }
            hasError = true;
        }

        // Address Validation
        const isStorePickup = currentSelectedDelivery && currentSelectedDelivery.id === 'store_pickup';
        if (isStorePickup && !address) {
            address = 'Store Pickup (In-Person at Shop Counter)';
        } else if (!address || address.length < 6) {
            if (addressInput) addressInput.classList.add('input-error');
            if (addressError) {
                addressError.textContent = 'Please provide a detailed delivery address (House, Road, Area).';
                addressError.classList.add('visible');
            }
            hasError = true;
        }

        if (hasError) {
            showToast('Please correct the highlighted fields.', 'error');
            return;
        }

        // Calculate final totals
        const pricing = recalculateCheckoutTotals();

        // Generate Order ID
        const orderId = 'SV-' + Date.now().toString().slice(-6);
        const orderTimestamp = new Date().toISOString();

        // Build WhatsApp Message Payload
        let msg = `*🛍️ নতুন অর্ডার — ${window.CONFIG.storeName}*\n`;
        msg += `*Order ID:* #${orderId}\n\n`;
        msg += `👤 *Customer:* ${name}\n`;
        msg += `📞 *Phone:* ${phoneCheck.normalized}\n`;
        msg += `📍 *Delivery Address:* ${address}\n\n`;
        msg += `🚚 *Delivery Method:* ${currentSelectedDelivery.name} (${currentSelectedDelivery.fee === 0 ? 'FREE' : formatBDT(currentSelectedDelivery.fee)})\n`;
        msg += `💳 *Payment Method:* ${currentSelectedPayment.name}\n\n`;
        msg += `📦 *Ordered Items:*\n`;

        cart.forEach((item, index) => {
            msg += `${index + 1}. ${item.name} (${item.qty}x) — ${formatBDT(item.price * item.qty)}\n`;
        });

        msg += `\n───────────────\n`;
        msg += `💵 *Subtotal:* ${formatBDT(pricing.subtotal)}\n`;
        msg += `🚚 *Delivery Fee:* ${formatBDT(pricing.deliveryFee)}\n`;
        msg += `💰 *Grand Total:* ${formatBDT(pricing.grandTotal)}\n`;
        msg += `───────────────\n`;
        
        if (pricing.advancePayable > 0) {
            msg += `📲 *bKash Advance Payable Now:* ${formatBDT(pricing.advancePayable)}\n`;
            msg += `bKash Number: ${window.CONFIG.bkashNumber}\n`;
        }
        if (pricing.dueOnDelivery > 0) {
            msg += `🤝 *Cash on Delivery (COD) Due:* ${formatBDT(pricing.dueOnDelivery)}`;
            if (pricing.codFee > 0) {
                msg += ` _(Pathao COD Collection fee: ${formatBDT(pricing.codFee)} deducted on merchant payout)_`;
            }
            msg += `\n`;
        }
        
        msg += `\n*Note:* এই মেসেজের সাথে bKash Send Money এর TrxID অথবা স্ক্রিনশট অ্যাটাচ করে পাঠান।`;

        const waNumber = window.CONFIG.whatsappNumber || '8801327045005';
        const encodedMsg = encodeURIComponent(msg);
        const waUrl = `https://wa.me/${waNumber}?text=${encodedMsg}`;

        // Construct complete order record
        const orderRecord = {
            id: orderId,
            timestamp: orderTimestamp,
            customer: {
                name,
                phone: phoneCheck.normalized,
                address
            },
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
            delivery: currentSelectedDelivery,
            payment: currentSelectedPayment,
            pricing,
            whatsappUrl: waUrl,
            webhookStatus: 'unconfigured'
        };

        lastGeneratedOrder = orderRecord;

        // CRITICAL BUG FIX (Issue 3.3):
        // Immediately launch WhatsApp window on user gesture to avoid mobile popup blockers!
        window.open(waUrl, '_blank');

        // Asynchronous webhook dispatch with AbortController 5000ms timeout (Issue 2.2)
        let webhookStatus = 'unconfigured';
        if (window.CONFIG && window.CONFIG.orderWebhookUrl) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            try {
                fetch(window.CONFIG.orderWebhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderRecord),
                    signal: controller.signal
                }).then(() => {
                    clearTimeout(timeoutId);
                    orderRecord.webhookStatus = 'sent';
                    updateOrderInLedger(orderRecord);
                }).catch(err => {
                    clearTimeout(timeoutId);
                    orderRecord.webhookStatus = err.name === 'AbortError' ? 'timeout' : 'failed';
                    updateOrderInLedger(orderRecord);
                    console.warn('Order webhook request failed:', err);
                });
                webhookStatus = 'sent'; // Optimistically initialized, tracked via controller callback
            } catch (e) {
                clearTimeout(timeoutId);
                webhookStatus = 'failed';
                console.warn('Webhook initiation failed:', e);
            }
        }
        orderRecord.webhookStatus = webhookStatus;

        // Persist order in local ledger with initial status (Roadmap 4 / Issue 2.4)
        try {
            const existingOrders = JSON.parse(localStorage.getItem('sv_orders') || '[]');
            existingOrders.unshift(orderRecord);
            localStorage.setItem('sv_orders', JSON.stringify(existingOrders));
        } catch (err) {
            console.warn('Could not save to sv_orders ledger:', err);
        }

        // Close checkout modal and show Order Confirmation modal
        closeCheckout();
        showOrderConfirmationModal(orderRecord);
    }

    // Helper to update order record in ledger when webhook status resolves
    function updateOrderInLedger(updatedOrder) {
        try {
            const orders = JSON.parse(localStorage.getItem('sv_orders') || '[]');
            const idx = orders.findIndex(o => o.id === updatedOrder.id);
            if (idx !== -1) {
                orders[idx] = updatedOrder;
                localStorage.setItem('sv_orders', JSON.stringify(orders));
            }
        } catch (e) {
            console.warn('Failed to update order in sv_orders ledger:', e);
        }
    }

    // =========================================================================
    // ORDER CONFIRMATION MODAL (Issue 3.3: Prevents lost cart data)
    // =========================================================================
    function showOrderConfirmationModal(order) {
        const modal = document.getElementById('confirmation-modal');
        if (!modal) return;

        const idEl = document.getElementById('confirm-order-id');
        const detailsEl = document.getElementById('confirm-order-details');
        const reopenBtn = document.getElementById('confirm-reopen-wa');
        const clearCartBtn = document.getElementById('confirm-clear-cart');
        const keepCartBtn = document.getElementById('confirm-keep-cart');

        if (idEl) idEl.textContent = `#${order.id}`;

        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="order-receipt-row">
                    <span>Customer:</span>
                    <strong>${escapeHTML(order.customer.name)} (${escapeHTML(order.customer.phone)})</strong>
                </div>
                <div class="order-receipt-row">
                    <span>Delivery Option:</span>
                    <strong>${escapeHTML(order.delivery.name)}</strong>
                </div>
                <div class="order-receipt-row">
                    <span>Order Total:</span>
                    <strong>${formatBDT(order.pricing.grandTotal)}</strong>
                </div>
                <div class="order-receipt-row" style="color: var(--bkash-pink);">
                    <span>bKash Advance to Send:</span>
                    <strong>${formatBDT(order.pricing.advancePayable)}</strong>
                </div>
                ${order.pricing.dueOnDelivery > 0 ? `
                <div class="order-receipt-row" style="color: var(--accent-emerald);">
                    <span>Remaining COD to Pathao:</span>
                    <strong>${formatBDT(order.pricing.dueOnDelivery)}</strong>
                </div>
                ${order.pricing.codFee > 0 ? `
                <div class="order-receipt-row cod-deduct-notice" style="color: var(--text-muted); font-size: 11px;">
                    <span>Pathao 1% COD Fee (Merchant Payout):</span>
                    <span>-${formatBDT(order.pricing.codFee)} (Net: ${formatBDT(order.pricing.netMerchantPayout)})</span>
                </div>` : ''}
                ` : ''}
            `;
        }

        // Re-open WhatsApp
        if (reopenBtn) {
            reopenBtn.onclick = () => {
                window.open(order.whatsappUrl, '_blank');
            };
        }

        // Clear Cart / Start Fresh
        if (clearCartBtn) {
            clearCartBtn.onclick = () => {
                clearCart();
                modal.classList.remove('open');
                showToast('Bag cleared. Thank you for your order!', 'success');
            };
        }

        // Keep Cart & Return
        if (keepCartBtn) {
            keepCartBtn.onclick = () => {
                modal.classList.remove('open');
            };
        }

        modal.classList.add('open');
    }

    // =========================================================================
    // AGE VERIFICATION GATE HARDENING (Issue 3.2)
    // =========================================================================
    function checkAgeGate() {
        const overlay = document.getElementById('age-gate-modal');
        if (!overlay) return;

        // Persistent Lockout Guard (Issue 3.2)
        const isDenied = localStorage.getItem('sv_age_denied') === 'true';
        if (isDenied) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            overlay.innerHTML = `
                <div class="age-gate-card age-denied-box">
                    <div class="age-shield-icon age-denied-icon">
                        <i class="fa-solid fa-ban"></i>
                    </div>
                    <h2>Access Denied</h2>
                    <div class="sub-title">প্রবেশাধিকার সংরক্ষিত (18+ Policy)</div>
                    <p style="color: var(--accent-red); font-weight: 600; margin-bottom: 12px;">
                        Access Denied: You must be 18 or older to access this store.
                    </p>
                    <p class="bilingual-warning" style="margin-bottom: 0;">
                        ১৮ বছরের কম বয়সী গ্রাহকদের জন্য এই স্টোরে প্রবেশ ও কেনাকাটা সম্পূর্ণ নিষিদ্ধ। অপ্রাপ্তবয়স্ক প্রবেশ প্রতিরোধে এই ডিভাইসের অ্যাক্সেস স্থায়ীভাবে বন্ধ করা হয়েছে।
                    </p>
                </div>
            `;
            return;
        }

        const isVerified = localStorage.getItem('sv_age_verified') === 'true';
        if (!isVerified) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }

        const confirmBtn = document.getElementById('age-confirm-btn');
        const underBtn = document.getElementById('age-under-btn');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                try {
                    localStorage.setItem('sv_age_verified', 'true');
                } catch (e) {
                    console.warn(e);
                }
                overlay.style.display = 'none';
                document.body.style.overflow = '';
                showToast('Age verified. Welcome to Safwan\'s Vape Shop!', 'success');
            };
        }

        if (underBtn) {
            underBtn.onclick = () => {
                try {
                    localStorage.setItem('sv_age_denied', 'true');
                } catch (e) {
                    console.warn(e);
                }
                window.location.href = 'https://www.google.com';
            };
        }
    }

    // =========================================================================
    // COPY TO CLIPBOARD HELPER (Issue 2.3: Placeholder Guard)
    // =========================================================================
    function setupCopyBkash() {
        const btn = document.getElementById('copy-bkash-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const isPlaceholder = window.CONFIG && (typeof window.CONFIG.isBkashPlaceholder === 'function'
                ? window.CONFIG.isBkashPlaceholder()
                : /xx/i.test(window.CONFIG.bkashNumber || ''));

            if (isPlaceholder) {
                showToast('bKash number will be shared on WhatsApp directly!', 'info');
                return;
            }

            const number = window.CONFIG ? window.CONFIG.bkashNumber : '017XXXXXXXX';
            navigator.clipboard.writeText(number).then(() => {
                showToast('bKash number copied to clipboard!', 'info');
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 2000);
            }).catch(() => {
                showToast(`Number: ${number}`, 'info');
            });
        });
    }

    // =========================================================================
    // MERCHANT ORDER LEDGER & PATHAO BULK CSV EXPORT (Issue 2.4)
    // =========================================================================
    function getStoredOrders() {
        try {
            const data = localStorage.getItem('sv_orders');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading sv_orders:', e);
            return [];
        }
    }

    function renderLedgerUI() {
        const orders = getStoredOrders();
        const metricsEl = document.getElementById('ledger-metrics');
        const wrapperEl = document.getElementById('ledger-table-wrapper');

        // Metrics Calculation
        const totalOrders = orders.length;
        const totalGross = orders.reduce((sum, o) => sum + (o.pricing ? (o.pricing.grandTotal || 0) : 0), 0);
        const totalCodDue = orders.reduce((sum, o) => sum + (o.pricing ? (o.pricing.dueOnDelivery || 0) : 0), 0);
        const totalNetPayout = orders.reduce((sum, o) => {
            if (!o.pricing) return sum;
            const net = o.pricing.netMerchantPayout !== undefined ? o.pricing.netMerchantPayout : (o.pricing.dueOnDelivery || 0);
            return sum + (o.pricing.advancePayable || 0) + net;
        }, 0);

        if (metricsEl) {
            metricsEl.innerHTML = `
                <div class="ledger-metric-card">
                    <span class="metric-label">Total Orders</span>
                    <strong class="metric-val">${totalOrders}</strong>
                </div>
                <div class="ledger-metric-card">
                    <span class="metric-label">Gross Revenue</span>
                    <strong class="metric-val">${formatBDT(totalGross)}</strong>
                </div>
                <div class="ledger-metric-card">
                    <span class="metric-label">Pending COD</span>
                    <strong class="metric-val" style="color: var(--accent-amber);">${formatBDT(totalCodDue)}</strong>
                </div>
                <div class="ledger-metric-card">
                    <span class="metric-label">Net Merchant Payout</span>
                    <strong class="metric-val" style="color: var(--accent-emerald);">${formatBDT(totalNetPayout)}</strong>
                </div>
            `;
        }

        if (wrapperEl) {
            if (orders.length === 0) {
                wrapperEl.innerHTML = `
                    <div class="ledger-empty">
                        <i class="fa-solid fa-receipt"></i>
                        <p>এখনো কোনো অর্ডার সংরক্ষিত নেই। গ্রাহক অর্ডার কনফার্ম করলে তা এখানে রেকর্ড হবে।</p>
                    </div>
                `;
            } else {
                let rowsHtml = '';
                orders.forEach(order => {
                    const dateFormatted = order.timestamp
                        ? new Date(order.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'N/A';
                    const netPayout = order.pricing && order.pricing.netMerchantPayout !== undefined
                        ? order.pricing.netMerchantPayout
                        : (order.pricing ? (order.pricing.dueOnDelivery - (order.pricing.codFee || 0)) : 0);

                    const statusClass = order.webhookStatus === 'sent' ? 'status-sent'
                        : order.webhookStatus === 'timeout' ? 'status-timeout'
                        : order.webhookStatus === 'failed' ? 'status-failed' : 'status-unconfigured';

                    rowsHtml += `
                        <tr>
                            <td><strong style="color: var(--accent-cyan);">#${escapeHTML(order.id)}</strong></td>
                            <td style="white-space: nowrap; font-size: 11px; color: var(--text-muted);">${escapeHTML(dateFormatted)}</td>
                            <td>
                                <div style="font-weight: 600;">${escapeHTML(order.customer ? order.customer.name : 'Unknown')}</div>
                                <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(order.customer ? order.customer.phone : '')}</div>
                            </td>
                            <td style="max-width: 180px; font-size: 12px; line-height: 1.3;" title="${escapeHTML(order.customer ? order.customer.address : '')}">
                                ${escapeHTML(order.customer ? order.customer.address : '')}
                            </td>
                            <td>
                                <span class="ledger-badge">${escapeHTML(order.delivery ? order.delivery.name.split('(')[0] : '')}</span>
                            </td>
                            <td><strong>${formatBDT(order.pricing ? order.pricing.grandTotal : 0)}</strong></td>
                            <td style="color: var(--accent-amber);">${formatBDT(order.pricing ? order.pricing.dueOnDelivery : 0)}</td>
                            <td style="color: var(--accent-emerald);"><strong>${formatBDT(netPayout)}</strong></td>
                            <td><span class="webhook-badge ${statusClass}">${escapeHTML(order.webhookStatus || 'unconfigured')}</span></td>
                        </tr>
                    `;
                });

                wrapperEl.innerHTML = `
                    <div class="ledger-table-scroll">
                        <table class="ledger-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Address</th>
                                    <th>Delivery</th>
                                    <th>Grand Total</th>
                                    <th>COD Due</th>
                                    <th>Net Payout</th>
                                    <th>Webhook</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    }

    function openLedger() {
        renderLedgerUI();
        const modal = document.getElementById('ledger-modal');
        if (modal) modal.classList.add('open');
    }

    function closeLedger() {
        const modal = document.getElementById('ledger-modal');
        if (modal) modal.classList.remove('open');
        if (window.location.hash === '#ledger' || window.location.hash === '#admin') {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    }

    function escapeCSV(val) {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
    }

    // Pathao Bulk CSV Export (Issue 2.4)
    function exportPathaoCSV() {
        const orders = getStoredOrders();
        if (orders.length === 0) {
            showToast('No orders available in ledger to export.', 'info');
            return;
        }

        // Columns: Store Name,Recipient Name,Recipient Phone,Recipient Address,Recipient District,Recipient Thana,COD Amount,Item Description,Special Note
        const headers = [
            'Store Name',
            'Recipient Name',
            'Recipient Phone',
            'Recipient Address',
            'Recipient District',
            'Recipient Thana',
            'COD Amount',
            'Item Description',
            'Special Note'
        ];

        const csvRows = [headers.join(',')];

        orders.forEach(order => {
            const storeName = (window.CONFIG && window.CONFIG.storeName) || "Safwan's Vape Shop BD";
            const custName = order.customer ? order.customer.name : '';
            const phone = order.customer ? order.customer.phone : '';
            const address = order.customer ? order.customer.address : '';
            
            // District determination
            let district = 'Dhaka';
            if (order.delivery && order.delivery.id === 'outside_dhaka') {
                district = 'Outside Dhaka';
            }
            const thana = 'Dhaka Metro';

            const codAmount = order.pricing ? (order.pricing.dueOnDelivery || 0) : 0;
            const itemsDesc = (order.items || []).map(i => `${i.name} (x${i.qty})`).join('; ');
            const note = `Order #${order.id} | ${order.payment ? order.payment.name : ''}`;

            const row = [
                escapeCSV(storeName),
                escapeCSV(custName),
                escapeCSV(phone),
                escapeCSV(address),
                escapeCSV(district),
                escapeCSV(thana),
                escapeCSV(codAmount),
                escapeCSV(itemsDesc),
                escapeCSV(note)
            ];
            csvRows.push(row.join(','));
        });

        // Trigger CSV Download with UTF-8 BOM
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `pathao_orders_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Exported ${orders.length} order(s) for Pathao upload!`, 'success');
    }

    function clearLedgerOrders() {
        const orders = getStoredOrders();
        if (orders.length === 0) {
            showToast('Ledger is already empty.', 'info');
            return;
        }
        if (confirm(`Are you sure you want to permanently clear all ${orders.length} order record(s) from this browser?`)) {
            localStorage.removeItem('sv_orders');
            renderLedgerUI();
            showToast('All order records have been cleared.', 'info');
        }
    }

    function checkHashRoute() {
        if (window.location.hash === '#ledger' || window.location.hash === '#admin') {
            openLedger();
        }
    }

    // =========================================================================
    // EXPOSE TO GLOBAL WINDOW
    // =========================================================================
    window.App = {
        addToCart,
        removeFromCart,
        changeQty,
        openCartPanel,
        closeCartPanel,
        toggleCart,
        openCheckout,
        closeCheckout,
        submitOrder,
        showToast,
        clearCart,
        openLedger,
        closeLedger,
        exportPathaoCSV,
        clearLedgerOrders
    };

    // =========================================================================
    // INIT ON DOM READY
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        checkAgeGate();
        loadProducts();
        setupCopyBkash();

        // Keyboard Shortcut: Ctrl+Shift+L or Cmd+Shift+L for Merchant Ledger
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
                e.preventDefault();
                const modal = document.getElementById('ledger-modal');
                if (modal && modal.classList.contains('open')) {
                    closeLedger();
                } else {
                    openLedger();
                }
            }
        });

        // Hash Route Navigation for #ledger / #admin
        window.addEventListener('hashchange', checkHashRoute);
        checkHashRoute();

        // Footer Ledger link handler
        const ledgerBtn = document.getElementById('open-ledger-btn');
        if (ledgerBtn) {
            ledgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openLedger();
            });
        }

        // Update store dynamic text if placeholders exist
        if (window.CONFIG) {
            const footerPhone = document.getElementById('footer-phone');
            if (footerPhone) footerPhone.textContent = window.CONFIG.supportPhoneDisplay;
            const waFloat = document.getElementById('wa-floating-btn');
            if (waFloat) waFloat.href = `https://wa.me/${window.CONFIG.whatsappNumber}`;
        }
    });

})();
