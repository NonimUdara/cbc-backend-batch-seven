import express from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';

const orderRouter = express.Router();

orderRouter.post("/", createOrder)

orderRouter.get("/", getOrders)

orderRouter.put("/status/:oderID", updateOrderStatus);

export default orderRouter;