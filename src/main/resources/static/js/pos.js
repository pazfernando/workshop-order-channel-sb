(function () {
    const cart = new Map();
    const recentOrders = [];
    let lastCreatedOrder = null;

    const currencyFormatter = new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD'
    });

    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));

    const elements = {
        clock: document.getElementById('clock'),
        sellerName: document.getElementById('sellerName'),
        cartBody: document.getElementById('cartBody'),
        subtotalValue: document.getElementById('subtotalValue'),
        taxValue: document.getElementById('taxValue'),
        totalValue: document.getElementById('totalValue'),
        payButton: document.getElementById('payButton'),
        recentOrders: document.getElementById('recentOrders'),
        lookupOrderId: document.getElementById('lookupOrderId'),
        lookupButton: document.getElementById('lookupButton'),
        confirmationOrderId: document.getElementById('confirmationOrderId'),
        confirmationTotal: document.getElementById('confirmationTotal'),
        confirmationPayload: document.getElementById('confirmationPayload'),
        printTicketButton: document.getElementById('printTicketButton'),
        newSaleButton: document.getElementById('newSaleButton'),
        orderDetailContent: document.getElementById('orderDetailContent'),
        toastRegion: document.getElementById('toastRegion')
    };

    function updateClock() {
        elements.clock.textContent = new Intl.DateTimeFormat('es-EC', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }).format(new Date());
    }

    function roundMoney(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    function getTotals() {
        const subtotal = Array.from(cart.values()).reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);
        const tax = roundMoney(subtotal * window.POS_CONFIG.taxRate);
        const total = roundMoney(subtotal + tax);
        return {
            subtotal: roundMoney(subtotal),
            tax,
            total
        };
    }

    function renderCart() {
        elements.cartBody.innerHTML = '';

        if (cart.size === 0) {
            elements.cartBody.innerHTML = '<tr class="empty-cart-row"><td colspan="5">Seleccione productos del catalogo.</td></tr>';
        } else {
            cart.forEach((item) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>
                        <input class="form-control quantity-input" type="number" min="1" max="99"
                               value="${item.quantity}" data-sku="${escapeHtml(item.sku)}">
                    </td>
                    <td>${currencyFormatter.format(item.price)}</td>
                    <td>${currencyFormatter.format(roundMoney(item.price * item.quantity))}</td>
                    <td><button class="remove-line" type="button" data-sku="${escapeHtml(item.sku)}">X</button></td>
                `;
                elements.cartBody.appendChild(row);
            });
        }

        const totals = getTotals();
        elements.subtotalValue.textContent = currencyFormatter.format(totals.subtotal);
        elements.taxValue.textContent = currencyFormatter.format(totals.tax);
        elements.totalValue.textContent = currencyFormatter.format(totals.total);
        elements.payButton.disabled = cart.size === 0;
    }

    function renderRecentOrders() {
        elements.recentOrders.innerHTML = '';

        if (recentOrders.length === 0) {
            elements.recentOrders.innerHTML = '<div class="empty-orders">No hay ordenes creadas en esta sesion.</div>';
            return;
        }

        recentOrders.slice(0, 5).forEach((order) => {
            const button = document.createElement('button');
            button.className = 'recent-order';
            button.type = 'button';
            button.dataset.orderId = order.orderId;
            button.innerHTML = `
                <span class="recent-order-id">${escapeHtml(order.orderId)}</span>
                <span class="recent-order-meta">
                    <span>${currencyFormatter.format(Number(order.total || 0))}</span>
                    <span class="status-pill">${escapeHtml(order.status || 'CREATED')}</span>
                    <span>${escapeHtml(order.timestamp)}</span>
                </span>
            `;
            elements.recentOrders.appendChild(button);
        });
    }

    function addProduct(product) {
        const current = cart.get(product.sku);
        if (current) {
            current.quantity += 1;
        } else {
            cart.set(product.sku, {
                ...product,
                quantity: 1
            });
        }
        renderCart();
    }

    function buildOrderRequest() {
        const totals = getTotals();
        return {
            channel: 'PHYSICAL_STORE_POS',
            pointOfSale: window.POS_CONFIG.cashRegister,
            sellerName: elements.sellerName.value.trim() || 'Vendedor',
            currency: 'USD',
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.total,
            items: Array.from(cart.values()).map((item) => ({
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: roundMoney(item.price * item.quantity)
            })),
            createdAt: new Date().toISOString()
        };
    }

    async function createOrder() {
        if (cart.size === 0) {
            return;
        }

        elements.payButton.disabled = true;
        elements.payButton.textContent = 'PROCESANDO...';
        const request = buildOrderRequest();

        try {
            const response = await fetch('/api/pos/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(request)
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.upstreamBody || payload.message || 'No se pudo crear la orden.');
            }

            const orderId = extractOrderId(payload);
            const status = payload.status || payload.orderStatus || 'CREATED';
            const total = Number(payload.total || request.total);
            const timestamp = payload.createdAt || request.createdAt;
            lastCreatedOrder = {
                ...payload,
                orderId,
                status,
                total,
                timestamp,
                request
            };

            recentOrders.unshift(lastCreatedOrder);
            recentOrders.splice(5);
            renderRecentOrders();

            elements.confirmationOrderId.textContent = orderId;
            elements.confirmationTotal.textContent = currencyFormatter.format(total);
            elements.confirmationPayload.textContent = JSON.stringify(lastCreatedOrder, null, 2);
            confirmationModal.show();
        } catch (error) {
            showToast(error.message, true);
            elements.payButton.disabled = false;
        } finally {
            elements.payButton.textContent = 'PAGAR / CREAR ORDEN';
            if (cart.size > 0) {
                elements.payButton.disabled = false;
            }
        }
    }

    async function lookupOrder(orderId) {
        const trimmedOrderId = orderId.trim();
        if (!trimmedOrderId) {
            showToast('Ingrese un ID de orden para buscar.', true);
            return;
        }

        elements.lookupButton.disabled = true;
        elements.lookupButton.textContent = 'Buscando...';

        try {
            const response = await fetch(`/api/pos/orders/${encodeURIComponent(trimmedOrderId)}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.upstreamBody || payload.message || 'No se encontro la orden.');
            }

            showOrderDetail(payload);
        } catch (error) {
            showToast(error.message, true);
        } finally {
            elements.lookupButton.disabled = false;
            elements.lookupButton.textContent = 'Buscar orden';
        }
    }

    function showOrderDetail(order) {
        elements.orderDetailContent.textContent = JSON.stringify(order, null, 2);
        orderDetailModal.show();
    }

    function clearCart() {
        cart.clear();
        renderCart();
    }

    function printTicket() {
        if (!lastCreatedOrder) {
            return;
        }
        console.log('Ticket POS simulado', lastCreatedOrder);
        showToast('Ticket enviado a consola del navegador.');
    }

    function extractOrderId(payload) {
        return payload.orderId
            || payload.id
            || payload.order_id
            || payload.data?.orderId
            || payload.data?.id
            || `POS-${Date.now()}`;
    }

    function showToast(message, isError) {
        const toast = document.createElement('div');
        toast.className = `pos-toast${isError ? ' error' : ''}`;
        toast.textContent = message;
        elements.toastRegion.appendChild(toast);
        setTimeout(() => toast.remove(), 4200);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    document.querySelectorAll('.product-tile').forEach((button) => {
        button.addEventListener('click', () => {
            addProduct({
                sku: button.dataset.sku,
                name: button.dataset.name,
                price: Number(button.dataset.price)
            });
        });
    });

    elements.cartBody.addEventListener('input', (event) => {
        if (!event.target.classList.contains('quantity-input')) {
            return;
        }
        const sku = event.target.dataset.sku;
        const item = cart.get(sku);
        if (!item) {
            return;
        }
        item.quantity = Math.max(1, Math.min(99, Number(event.target.value || 1)));
        renderCart();
    });

    elements.cartBody.addEventListener('click', (event) => {
        if (!event.target.classList.contains('remove-line')) {
            return;
        }
        cart.delete(event.target.dataset.sku);
        renderCart();
    });

    elements.payButton.addEventListener('click', createOrder);
    elements.lookupButton.addEventListener('click', () => lookupOrder(elements.lookupOrderId.value));
    elements.lookupOrderId.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            lookupOrder(elements.lookupOrderId.value);
        }
    });
    elements.recentOrders.addEventListener('click', (event) => {
        const orderButton = event.target.closest('.recent-order');
        if (!orderButton) {
            return;
        }
        const order = recentOrders.find((current) => current.orderId === orderButton.dataset.orderId);
        if (order) {
            showOrderDetail(order);
        }
    });
    elements.printTicketButton.addEventListener('click', printTicket);
    elements.newSaleButton.addEventListener('click', clearCart);

    updateClock();
    setInterval(updateClock, 1000);
    renderCart();
    renderRecentOrders();
})();
