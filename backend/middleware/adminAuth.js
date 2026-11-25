import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Allows the request through only when the token belongs to a user whose role is "admin".
// The role is read from the database on every request, so removing admin access takes effect at once.
const adminAuth = async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not Authorized Login Again' });
    }

    try {
        const user = await userModel.findById(decoded.id).select('role');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        req.adminId = user._id.toString();
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Error' });
    }
}

export default adminAuth;
