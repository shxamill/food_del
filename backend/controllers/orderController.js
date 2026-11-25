import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import foodModel from "../models/foodModel.js";
import Stripe from "stripe";

//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Created on first use, so the app can start (and be tested) without a Stripe key
let stripeClient;
const getStripe = () => {
    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

// Rebuilds the order from the database so prices and totals can't be changed by the client
const buildOrderItems = async (requestedItems) => {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
        throw new Error("Cart is empty");
    }
    const items = [];
    for (const item of requestedItems) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("Invalid quantity");
        }
        const food = await foodModel.findById(String(item._id));
        if (!food) {
            throw new Error("Item not found");
        }
        items.push({ _id: food._id.toString(), name: food.name, price: food.price, quantity });
    }
    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + deliveryCharge;
    return { items, amount };
}

// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {

    try {
        const { items, amount } = await buildOrderItems(req.body.items);
        const newOrder = new orderModel({
            userId: String(req.body.userId),
            items,
            amount,
            address: req.body.address,
        })
        await newOrder.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await getStripe().checkout.sessions.create({
            success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
            line_items: line_items,
            mode: 'payment',
            metadata: { orderId: newOrder._id.toString() },
        });

        newOrder.stripeSessionId = session.id;
        await newOrder.save();
        await userModel.findByIdAndUpdate(String(req.body.userId), { cartData: {} });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Placing User Order for Frontend with cash on delivery
const placeOrderCod = async (req, res) => {

    try {
        const { items, amount } = await buildOrderItems(req.body.items);
        const newOrder = new orderModel({
            userId: String(req.body.userId),
            items,
            amount,
            address: req.body.address,
            payment: true,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(String(req.body.userId), { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: String(req.body.userId) });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    const { orderId, status } = req.body;
    if (typeof orderId !== "string" || typeof status !== "string") {
        return res.json({ success: false, message: "Invalid request" })
    }
    try {
        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }

}

// Called by the frontend after Stripe redirects back. The "success" flag from the browser is not trusted:
// an order is only marked paid when Stripe itself says its checkout session was paid.
const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    if (typeof orderId !== "string") {
        return res.json({ success: false, message: "Not Verified" })
    }
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }
        if (order.payment) {
            return res.json({ success: true, message: "Paid" })
        }
        if (!order.stripeSessionId) {
            return res.json({ success: false, message: "Not Verified" })
        }

        const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
            order.payment = true;
            await order.save();
            return res.json({ success: true, message: "Paid" })
        }

        if (success !== "true") {
            // Payment was cancelled: close the checkout session so it can't be paid later, then drop the order
            if (session.status === "open") {
                await getStripe().checkout.sessions.expire(session.id);
            }
            await orderModel.findByIdAndDelete(orderId)
        }
        res.json({ success: false, message: "Not Paid" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Not Verified" })
    }

}

export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, placeOrderCod }