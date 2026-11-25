import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'test-only-secret';

let mongod, app, userModel, orderModel, foodModel;
let userToken, adminToken;

const register = async (name, email) => {
    const res = await request(app).post('/api/user/register').send({ name, email, password: 'password123' });
    assert.equal(res.body.success, true, res.body.message);
    return res.body.token;
};

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    ({ default: app } = await import('../app.js'));
    ({ default: userModel } = await import('../models/userModel.js'));
    ({ default: orderModel } = await import('../models/orderModel.js'));
    ({ default: foodModel } = await import('../models/foodModel.js'));

    userToken = await register('Customer', 'customer@example.com');
    adminToken = await register('Admin', 'admin@example.com');
    await userModel.updateOne({ email: 'admin@example.com' }, { role: 'admin' });
});

after(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
});

const adminRoutes = [
    ['get', '/api/order/list'],
    ['post', '/api/order/status'],
    ['post', '/api/food/add'],
    ['post', '/api/food/remove'],
];

describe('admin routes', () => {
    for (const [method, path] of adminRoutes) {
        test(`${method.toUpperCase()} ${path} rejects requests without a token`, async () => {
            const res = await request(app)[method](path);
            assert.equal(res.status, 401);
            assert.equal(res.body.success, false);
        });

        test(`${method.toUpperCase()} ${path} rejects an invalid token`, async () => {
            const res = await request(app)[method](path).set('token', 'not-a-real-token');
            assert.equal(res.status, 401);
        });

        test(`${method.toUpperCase()} ${path} rejects a normal customer`, async () => {
            const res = await request(app)[method](path).set('token', userToken);
            assert.equal(res.status, 403);
            assert.equal(res.body.message, 'Admin access required');
        });
    }

    test('an unauthorised upload writes no file to disk', async () => {
        const before = fs.existsSync('uploads') ? fs.readdirSync('uploads').length : 0;
        const res = await request(app)
            .post('/api/food/add')
            .set('token', userToken)
            .field('name', 'Sneaky')
            .attach('image', Buffer.from('not really an image'), 'sneaky.png');
        assert.equal(res.status, 403);
        const afterCount = fs.existsSync('uploads') ? fs.readdirSync('uploads').length : 0;
        assert.equal(afterCount, before);
    });

    test('an admin can add, list and remove food, and update an order status', async () => {
        const add = await request(app)
            .post('/api/food/add')
            .set('token', adminToken)
            .field('name', 'Test Salad')
            .field('description', 'Only used by the tests')
            .field('price', '120')
            .field('category', 'Salad')
            .attach('image', Buffer.from('fake image bytes'), 'salad.png');
        assert.equal(add.body.success, true, add.body.message);

        const food = await foodModel.findOne({ name: 'Test Salad' });
        assert.ok(food);

        const order = await orderModel.create({ userId: 'someone', items: [], amount: 50, address: {} });
        const status = await request(app).post('/api/order/status').set('token', adminToken)
            .send({ orderId: order._id.toString(), status: 'Out for delivery' });
        assert.equal(status.body.success, true);
        assert.equal((await orderModel.findById(order._id)).status, 'Out for delivery');

        const list = await request(app).get('/api/order/list').set('token', adminToken);
        assert.equal(list.status, 200);
        assert.ok(list.body.data.length >= 1);

        const remove = await request(app).post('/api/food/remove').set('token', adminToken).send({ id: food._id.toString() });
        assert.equal(remove.body.success, true);
        assert.equal(await foodModel.findById(food._id), null);
        assert.equal(fs.existsSync(`uploads/${food.image}`), false);
    });

    test('login tells the client the account role', async () => {
        const res = await request(app).post('/api/user/login').send({ email: 'admin@example.com', password: 'password123' });
        assert.equal(res.body.role, 'admin');
    });
});

describe('orders', () => {
    test('prices and totals come from the menu, not from the request', async () => {
        const pizza = await foodModel.create({ name: 'Pizza', description: 'Test', price: 300, image: 'x.png', category: 'Pizza' });
        const res = await request(app).post('/api/order/placecod').set('token', userToken).send({
            items: [{ _id: pizza._id.toString(), name: 'Pizza', price: 1, quantity: 2 }],
            amount: 1,
            address: { city: 'Bengaluru' },
        });
        assert.equal(res.body.success, true, res.body.message);

        const order = await orderModel.findOne({ 'address.city': 'Bengaluru' });
        assert.equal(order.items[0].price, 300);
        assert.equal(order.amount, 300 * 2 + 50);
    });

    test('an order for an item that is not on the menu is refused', async () => {
        const res = await request(app).post('/api/order/placecod').set('token', userToken).send({
            items: [{ _id: new mongoose.Types.ObjectId().toString(), quantity: 1 }],
            address: {},
        });
        assert.equal(res.body.success, false);
    });

    test('verify does not mark an order paid just because the browser says so', async () => {
        const order = await orderModel.create({ userId: 'someone', items: [], amount: 50, address: {} });
        const res = await request(app).post('/api/order/verify').send({ orderId: order._id.toString(), success: 'true' });
        assert.equal(res.body.success, false);
        assert.equal((await orderModel.findById(order._id)).payment, false);
    });
});
