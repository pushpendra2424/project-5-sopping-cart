const express = require("express");
const userController = require('../controller/userController')
const productController = require('../controller/productController')
const cartController = require('../controller/cartController')
const orederController = require('../controller/orderController')
const auth = require('../middleware/auth')
const router = express.Router()

// =================userapi=======================

router.post('/register', userController.registerUser)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile', auth.auth, userController.getDetails)
router.put('/user/:userId/profile', auth.auth, userController.updateDetails)

// ======================productapi======================

router.post('/products', productController.addProducts)
router.get('/products', productController.getdata)
router.get('/products/:productId', productController.getProductById)
router.put('/products/:productId', productController.updateProducts)
router.delete('/products/:productId', productController.deleteProduct)

// ========================cartapi============================

router.post('/users/:userId/cart',auth.auth, cartController.createCart)
router.get('/users/:userId/cart', auth.auth, cartController.getCartByUserId)
router.put('/users/:userId/cart', auth.auth, cartController.removeProduct)
router.delete('/users/:userId/cart', auth.auth, cartController.deleteCart)

// ========================orderApi============================

router.post('/users/:userId/orders', auth.auth, orederController.createOrder)
router.put('/users/:userId/orders', auth.auth, orederController.updateOrder)

module.exports = router;