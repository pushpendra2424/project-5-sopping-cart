const validation = require('../validator/validator')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')

//===================================================createCart========================================================

const createCart = async function (req, res) {
    try {
        let data = req.body;
        let userId = req.params.userId;
        let cartId = req.body.cartId;
        let productId = req.body.productId

        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please enter valid userid" })
        }
        let user = await userModel.findById({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: "No user found" })
        }
        //authorization
        if (userId != req.userid) {
            return res.status(403).send({ status: false, message: "unauthorized user, not allowed to create cart in another user account" })
        }
        if (!validation.validBody(data)) {
            return res.status(400).send({ status: false, message: "please enter data to create a cart" })
        }
        if (!validation.isValid(productId) || !validation.validObjectId(productId)) {
            return res.status(400).send({ status: false, message: "enter valid product Id" })
        }
        // find product in db
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: "no product found" })
        }
        // check cart with user id
        let existingCart = await cartModel.findOne({ userId: userId })
        // check when other cart in body  i.e, different from user
        if (cartId && existingCart._id != cartId) {
            return res.status(400).send({ status: false, message: " cartId not match" })
        }
        // check cart with cartId and userId
        let cart = await cartModel.findOne({ _id: cartId, userId: userId })
        let cartData = {};
        if (cart || existingCart) {
            //if cartId is provided in body
            if (cart) {
                let existingProductIndex = cart.items.findIndex(p => p.productId == productId)
                //if product in cart is same as provided in body
                if (existingProductIndex >= 0) {
                    let existingProduct = cart.items[existingProductIndex]
                    existingProduct.quantity += 1
                    cartData.items = cart.items    // saving existingProduct after adding quantity 
                    // updating price and items in cart
                    cartData.totalPrice = cart.totalPrice + product.price
                    cartData.totalItems = cart.items.length;
                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, cartData, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: updatedCart })
                }
                //diifernt product to add in cart
                else {
                    let arr = cart.items
                    list = { productId: productId, quantity: 1 }
                    arr.push(list)
                    cartData.items = arr
                    cartData.totalPrice = cart.totalPrice + product.price;
                    cartData.totalItems = cart.items.length
                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, cartData, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: updatedCart })
                }
            }
            //if cartId is  not provided in body
            if (existingCart) {
                let existingCartitem = existingCart.items.findIndex(p => p.productId == productId)
                //if product in cart is same as provided in body
                if (existingCartitem >= 0) {
                    let existingProduct = existingCart.items[existingCartitem]
                    existingProduct.quantity += 1
                    cartData.items = existingCart.items
                    // updating price and items in cart
                    cartData.totalPrice = existingCart.totalPrice + product.price
                    cartData.totalItems = existingCart.items.length;
                    const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, cartData, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: updatedCart })
                }
                //diifernt product to add in cart
                else {
                    let arr = existingCart.items
                    list = { productId: productId, quantity: 1 }
                    arr.push(list)
                    cartData.items = arr
                    cartData.totalPrice = existingCart.totalPrice + product.price;
                    cartData.totalItems = existingCart.items.length
                    const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, cartData, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: updatedCart })
                }
            }
        }
        else {
            let arr = []
            list = { productId: productId, quantity: 1 }
            arr.push(list)
            totalPrice = product.price
            totalItems = 1
            let products = { userId, items: arr, totalPrice, totalItems }
            let cart = await cartModel.create(products)
            return res.status(201).send({ status: true, message: "Success", data: cart })
        }
    }
    catch (err) {
        return res.status(500).send({ staus: false, error: err.message })
    }
}

//===================================================removeProduct========================================================

const removeProduct = async function (req, res) {
    try {
        if (!validation.validBody(req.body)) {
            return res.status(400).send({ status: false, msg: "Bad req Body" })
        }
        let userId = req.params.userId
        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Bad ObjectId in params" })
        }
        let userExist = await userModel.findById({ _id: userId })
        if (!userExist) {
            return res.status(404).send({ status: false, msg: "User Does Not Exist" })
        }
        //authorization
        if (userId != req.userid) {
            return res.status(403).send({ status: false, message: `Unauthorized access! info of owner doesn't match` });
        }
        let { cartId, productId, removeProduct } = req.body

        if (!validation.isValid(cartId) || !validation.isValid(productId) || !validation.isValid(removeProduct)) {
            return res.status(400).send({ status: false, msg: "Bad fields please enter cartId, productId,removeProduct" })
        }
        if (!(removeProduct == '0' || removeProduct == '1')) {
            return res.status(400).send({ status: false, msg: "Bad field for removeProduct" })
        }
        removeProduct = Number(removeProduct)
        if (!validation.validObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "Bad ObjectId for cartId" })
        }
        if (!validation.validObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "Bad ObjectId for ProductId" })
        }
        let cartExists = await cartModel.findById({ _id: cartId })
        if (!cartExists) return res.status(404).send({ status: false, msg: "Cart Does Not Exist" })

        let productExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productExists) return res.status(404).send({ status: false, msg: "Prduct Does not Exists" })

        if (cartExists.userId != req.params.userId) {
            return res.status(400).send({ status: false, msg: "Params userId does not match with the userId inside of Cart" })
        }
        if (removeProduct == 0) {
            let flag
            let quantity;
            let totalPrice;
            let itemsArr = await cartModel.findById({ _id: cartId })
            if (itemsArr) {
                for (let i = 0; i < cartExists.items.length; i++) {
                    if (cartExists.items[i].productId == productId) {
                        flag = 1
                        quantity = cartExists.items[i].quantity
                    }
                }
                if (flag !== 1) {
                    return res.status(404).send({ status: false, msg: "Deleted or does not Exists" })
                }
                totalPrice = cartExists.totalPrice
                totalPrice -= (productExists.price * quantity)
                let newCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, $set: { totalPrice: totalPrice }, $inc: { totalItems: -1 } }, { new: true })
                return res.status(200).send({ status: true, message: "Success", data: newCart })
            }
        }
        else if (removeProduct == 1) {
            let prodPrice = productExists.price;
            let flag
            let quantity;
            let totalPrice = cartExists.totalPrice
            totalPrice -= prodPrice
            for (let i = 0; i < cartExists.items.length; i++) {
                if (cartExists.items[i].productId == productId) {
                    flag = 1
                    quantity = cartExists.items[i].quantity
                }
            }
            if (flag !== 1) {
                return res.status(404).send({ status: false, msg: "Deleted or does not Exists" })
            }
            if (quantity > 1) {
                let newCart = await cartModel.findOneAndUpdate({ _id: cartId, 'items.productId': productId }, { $set: { totalPrice: totalPrice }, $inc: { 'items.$.quantity': -1 } }, { new: true })
                return res.status(200).send({ status: true,message:"Success", data: newCart })
            }
            else if (quantity == 1) {
                totalPrice = cartExists.totalPrice
                totalPrice -= (productExists.price * quantity)
                let newCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, $set: { totalPrice: totalPrice }, $inc: { totalItems: -1 } }, { new: true })
                return res.status(200).send({ status: true, message: "Success", data: newCart })
            }
        }
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================================getCartByUserId========================================================

const getCartByUserId = async function (req, res) {
    try {
        let userId = req.params.userId;
        // validating userid from params
      
        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, message: "UserId is Invalid" });
        }
        let user = await userModel.findById({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: "User does't exist" });
        }
        let usercartid = await cartModel.findOne({ userId }).select({ __v: 0, updatedAt: 0, createdAt: 0 });
        if (!usercartid) {
            return res.status(404).send({ status: false, message: "Cart does't exist" });
        }
        // authorization
        if (userId != req.userid) {
            return res.status(403).send({ status: false, message: `Unauthorized access! info of owner doesn't match` });
        }
        return res.status(200).send({ status: true, message: "Success", data: usercartid })
    }
    catch (error) {
       // console.log(error)
        return res.status(500).send({ status: false, error: error.message });
    }
}

//===================================================deleteCart========================================================

const deleteCart = async function (req, res) {
    try {
        let user = req.params.userId
        if (!validation.validObjectId(user)) {
            return res.status(400).send({ status: false, message: "plesge enter valid objectId" })
        }
        let existUserId = await userModel.findById({ _id: user })
        if (!existUserId) {
            return res.status(404).send({ staus: false, message: "user does not exist" })
        }
        // authorization
        if (user != req.userid) {
            return res.status(403).send({ status: false, message: `Unauthorized access! info of owner doesn't match` });
        }
        const cart = await cartModel.findOne({ userId: user }).select({ _id: 1 })

        if (!cart) {
            return res.status(404).send({ status: false, message: "Cart does't exist" })
        }
        let cart1 = await cartModel.findOneAndUpdate({ _id: cart }, { $set: { totalPrice: 0, totalItems: 0, items: [] } }, { new: true })
        return res.status(204).send({ status: true, message: "success",data:cart1})
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createCart, removeProduct, getCartByUserId, deleteCart }
