import * as Service from "../services/userServices.js";
import redis from "../config/redis.js";
import PDFDocument from "pdfkit";
export const getProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const products = await Service.getAllProducts(page, limit);
        res.json(products);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch products" });
    }
};
// ─── CART ─────────────────────────────────────────────────────────────────────
export const getCart = async (req, res) => {
    try {
        const data = await Service.getCartService(req.user.id);
        res.json(data);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch cart" });
    }
};
export const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        await Service.addToCartService(req.user.id, product_id, quantity);
        res.json({ message: "Added to cart" });
    }
    catch {
        res.status(500).json({ message: "Failed to add to cart" });
    }
};
export const updateCart = async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: "Quantity must be at least 1" });
        }
        await Service.updateCartService(req.user.id, Number(req.params.id), quantity);
        res.json({ message: "Updated" });
    }
    catch {
        res.status(500).json({ message: "Failed to update cart" });
    }
};
export const deleteCart = async (req, res) => {
    try {
        await Service.deleteCartService(req.user.id, Number(req.params.id));
        res.json({ message: "Removed" });
    }
    catch {
        res.status(500).json({ message: "Failed to remove from cart" });
    }
};
// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await Service.getProfileService(req.user.id);
        res.json(user);
    }
    catch {
        res.status(500).json({ message: "Error fetching profile" });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        await Service.updateProfileService(req.user.id, name, email);
        res.json({ message: "Profile updated" });
    }
    catch {
        res.status(500).json({ message: "Error updating profile" });
    }
};
export const checkout = async (req, res) => {
    try {
        const result = await Service.checkoutService(req.user.id);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
export const buyAgain = async (req, res) => {
    try {
        const result = await Service.buyAgainService(req.user.id);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
};
// ─── PAYMENT PIN (set PIN on profile page) ────────────────────────────────────
export const setPaymentPin = async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ message: "PIN must be exactly 4 digits" });
        }
        // Store in Redis — no expiry, user controls it
        await redis.set(`payment_pin:${req.user.id}`, pin);
        res.json({ message: "PIN set successfully" });
    }
    catch {
        res.status(500).json({ message: "Failed to set PIN" });
    }
};
export const getOrders = async (req, res) => {
    try {
        const orders = await Service.getOrdersService(req.user.id);
        res.json(orders);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};
export const canBuyAgain = async (req, res) => {
    try {
        const cached = await redis.get(`recent_orders:${req.user.id}`);
        res.json({ available: !!cached });
    }
    catch {
        res.status(500).json({ available: false });
    }
};
export const downloadInvoice = async (req, res) => {
    try {
        const created_at = decodeURIComponent(req.params.created_at);
        const orders = await Service.getInvoiceDataService(req.user.id, created_at);
        if (!orders.length) {
            return res.status(404).json({ message: "Order not found" });
        }
        const doc = new PDFDocument({ margin: 40 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${created_at}.pdf`);
        doc.pipe(res);
        // 🧾 HEADER
        doc.fontSize(20).text("INVOICE", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date(created_at).toDateString()}`);
        doc.moveDown();
        // 🛒 ITEMS
        let total = 0;
        orders.forEach((item) => {
            const price = item.discount_price ?? item.price;
            const lineTotal = price * item.quantity;
            total += lineTotal;
            doc.text(`${item.name}  |  ${item.quantity} × ₹${price} = ₹${lineTotal}`);
        });
        doc.moveDown();
        doc.text(`Total: ₹${total}`, { align: "right" });
        doc.end();
    }
    catch (err) {
        res.status(500).json({ message: "Failed to generate invoice" });
    }
};
