import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin, isCustomer } from "./userController.js";

export async function createOrder(req, res) {
  //CBC0000001

  // if(req.user == null) {
  //     res.status(401).json({
  //         message: "Please login and try again"
  //     })
  //     return
  // }

  try {
    const user = req.user;
    if (user == null) {
      res.status(401).json({
        message: "unauthorized user",
      });
      return;
    }

    const orderList = await Order.find().sort({ date: -1 }).limit(1);

    let newOrderID = "CBC0000001";

    if (orderList.length !== 0) {
      let lastOrderIDInString = orderList[0].oderID; //CBC0000001
      let lastOrderNumberInString = lastOrderIDInString.replace("CBC", ""); //0000001
      let lastOrderNumber = parseInt(lastOrderNumberInString); //0000001
      let newOrderNumber = lastOrderNumber + 1; //0000002
      //pad start
      let newOrderNumberInString = newOrderNumber.toString().padStart(7, "0"); //0000002

      newOrderID = "CBC" + newOrderNumberInString; //CBC0000002
    }

    let customerName = req.body.customerName;
    if (customerName == null) {
      customerName = user.firstName + " " + user.lastName;
    }

    let phone = req.body.phone;
    if (phone == null) {
      phone = "Not provided";
    }

    const itemsInRequest = req.body.items;

    if (itemsInRequest.length == null) {
      res.status(400).json({
        message: "Items are required to place an order",
      });
      return;
    }

    if (!Array.isArray(itemsInRequest)) {
      res.status(400).json({
        message: "Items must be an array",
      });
      return;
    }

    const itemsToBeAdded = [];
    let total = 0;

    for (let i = 0; i < itemsInRequest.length; i++) {
      const item = itemsInRequest[i];

      const product = await Product.findOne({ productID: item.productID });

      if (product == null) {
        res.status(400).json({
          code : "not-found",
          message: `Product not found with ID ${item.productID}`,
          productID: item.productID,
        });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json(
          {
            code : "stock",
            message: `Product with ID ${item.productID} is out of stock`,
            productID: item.productID,
            availableStock: product.stock
          }
        );
        return;
      }

      itemsToBeAdded.push({
        productID: product.productID,
        quantity: item.quantity,
        name: product.name,
        price: product.price,
        image: product.images[0]
      });

      total += product.price * item.quantity;

    }

    const newOrder = new Order({
      oderID: newOrderID,
      items: itemsToBeAdded,
      customerName: customerName,
      email: user.email,
      address: req.body.address,
      phone: phone,
      total: total,
    });

    const savedOrder = await newOrder.save();

    // update stock
    // for (let i = 0; i < itemsToBeAdded.length; i++) {
    //   const item = itemsToBeAdded[i];
    //   await Product.updateOne(
    //     { productID: item.productID },
    //     { $inc: { stock: -item.quantity } }
    //   )
    // }

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      error: "Failed to create order",
    });
  }
}

export async function getOrders(req, res) {
  
  if(isAdmin(req)){
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } else if(isCustomer(req)) {
    const user = req.user;
    const orders = await Order.find({ email: user.email }).sort({ date: -1 });
    res.json(orders);
  } else {
    res.status(403).json(
      {
        message: "You are not authorized to view orders"
      }
    )
  }

}
