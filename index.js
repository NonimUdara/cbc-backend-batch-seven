import express from "express";
import mongoose from "mongoose";
// import Student from "./models/student.js"; // Import the Student model
// import studentRouter from "./routes/studentRouter.js";
import userRouter from "./routes/userRouter.js";
import orderRouter from "./routes/orderRouter.js";
import jwt from "jsonwebtoken";
import productRouter from "./routes/productRouter.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

app.use(
    (req, res, next) => {

        // console.log("Http request received to the middleware");
        let token = req.header("Authorization");

        //check have the token and if the token is valid
        if (token != null) {

            //remove the Bearer from the token
            token = token.replace("Bearer ", "");

            //console.log(token);

            //decrypt the token
            jwt.verify(token, process.env.JWT_SECRET,
                (err, decoded) => {
                    if (decoded == null) {
                        res.json({
                            message: "Invalid token please login again"
                        })
                        return
                    } else {
                        req.user = decoded;
                        // console.log(decoded);
                    }
                })
        }
        next();
    }
)

const connectionString = process.env.MONGO_URI;
mongoose.connect(connectionString).then(
    () => {
        console.log("Connected to MongoDB successfully!");
    }
).catch(
    () => {
        console.log("Error connecting to MongoDB");
    }
)

// app.use("/api/students", studentRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter)

// function success(){
//     console.log("Server is running successfully!");
// }

// app.listen(5000, success);


// app.delete("/",
//     (req, res) => {
//         console.log("Delete request received at root endpoint");
//     }
// )

app.listen(5000,
    () => {
        console.log("Server is running on port 5000!");
    });