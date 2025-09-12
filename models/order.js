import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    oderID: {
        type: String,
        required: true,
        unique: true
    },
    items: {
        type : [
            {
                productID: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                name : {
                    type: String,
                    required: true
                },
                price : {
                    type: Number,
                    required: true
                },
                image : {
                    type: String,
                    required: true
                }
            }
        ]
    },
    customerName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    total: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "pending"
    },
    date : {
        type: Date,
        required: true,
        default: Date.now
    }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;