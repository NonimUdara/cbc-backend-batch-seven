import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.get('/', getProducts);

productRouter.post('/', createProduct);

productRouter.get('/search', (req, res) => {
    res.json({
        message: "Search endpoint for products"
    });
})

productRouter.delete('/:productID', deleteProduct)

productRouter.put('/:productID', updateProduct);

productRouter.get('/:productID', getProductById);



export default productRouter;