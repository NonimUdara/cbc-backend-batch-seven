import express from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, getProductsBySearch, updateProduct } from '../controllers/productController.js';
import { get } from 'mongoose';

const productRouter = express.Router();

productRouter.get('/', getProducts);

productRouter.post('/', createProduct);

productRouter.delete('/:productID', deleteProduct)

productRouter.put('/:productID', updateProduct);

productRouter.get('/search/:query', getProductsBySearch);

productRouter.get('/:productID', getProductById);

export default productRouter;