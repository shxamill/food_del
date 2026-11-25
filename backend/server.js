import 'dotenv/config'
import app from "./app.js"
import { connectDB } from "./config/db.js"

const port = process.env.PORT || 4000;

// db connection
connectDB()

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))
