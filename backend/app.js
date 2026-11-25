import express from "express"
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"

// app config
const app = express()

// middlewares
app.use(express.json())
app.use(cors())

// rate limits (per IP): a general cap on the whole API and a tighter one on sign-up and login
const limitMessage = { success: false, message: "Too many requests, please try again later" }
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage })
app.use("/api", apiLimiter)

// api endpoints
app.use("/api/user", authLimiter, userRouter)
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

app.get("/", (req, res) => {
    res.send("API Working")
});

export default app;
