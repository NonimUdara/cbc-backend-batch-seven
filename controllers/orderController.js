import Order from "../models/order.js";

export async function createOrder(req, res) {

    //CBC0000001

    // if(req.user == null) {
    //     res.status(401).json({
    //         message: "Please login and try again"
    //     })
    //     return
    // }

    try{

        const orderList = await Order.find().sort({date : -1}).limit(1);

        let newOrderID = "CBC0000001";
        
        if(orderList.length !== 0) {

            let lastOrderIDInString = orderList[0].oderID; //CBC0000001
            let lastOrderNumberInString = lastOrderIDInString.replace("CBC", ""); //0000001
            let lastOrderNumber = parseInt(lastOrderNumberInString); //0000001
            let newOrderNumber = lastOrderNumber + 1; //0000002
            //pad start
            let newOrderNumberInString = newOrderNumber.toString().padStart(7, "0"); //0000002
            
            newOrderID = "CBC" + newOrderNumberInString; //CBC0000002
        }

        const newOrder = new Order({
            oderID : newOrderID,
            items : [],
            customerName : req.body.customerName,
            email : req.body.email,
            address : req.body.address,
            phone : req.body.phone,
            total : req.body.total,
            status : "Pending",
            date: new Date()
        });
        
        const savedOrder = await newOrder.save();

        res.status(201).json(
            {
            message: "Order created successfully",
            order: savedOrder
        }
    )

    } catch(err) {

        console.error("Error creating order:", err);
        res.status(500).json({
            error: "Failed to create order"
        });
    }

}