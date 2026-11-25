// Gives an existing user admin access: npm run make-admin -- someone@example.com
import 'dotenv/config';
import mongoose from 'mongoose';
import userModel from '../models/userModel.js';

const email = process.argv[2];
if (!email) {
    console.error('Usage: npm run make-admin -- <email>');
    process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await userModel.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
if (user) {
    console.log(`${email} is now an admin.`);
} else {
    console.error(`No user with the email ${email}. Register the account first, then run this again.`);
    process.exitCode = 1;
}
await mongoose.disconnect();
