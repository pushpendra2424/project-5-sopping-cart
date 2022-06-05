const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel')
const orderModel = require('../models/orderModel')
const validation = require('../validator/validator')

//==================================================createOrder===============================================

const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let cancellable = req.body.cancellable
        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, message: "invalid user ObjectId" })
        }
        let user = await userModel.findOne({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: "no user found" })
        }
        if (userId != req.userid) {
            return res.status(403).send({ status: false, message: "unauthorized user" })
        }
        let cart = await cartModel.findOne({ userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "no cart found" })
        }
        let a = [];
        let total = 0;

        for (let i = 0; i < cart.items.length; i++) {
            a[i] = cart.items[i].quantity
        }
        if (a.length == 0) {
            return res.status(404).send({ status: false, message: "cart is empty" })
        }
        for (let i in a) {
            total += a[i];
        }
        let obj = {
            items: cart.items,
            totalPrice: cart.totalPrice,
            totalItems: cart.totalItems,
            totalQuantity: total,
            userId: userId,
            cancellable: cancellable
        }
        let order = await orderModel.create(obj)
        let updateCart = await cartModel.findOneAndUpdate({ userId }, { $set: { totalPrice: 0, totalItems: 0, items: [] } }, { new: true })
        return res.status(200).send({ status: true, message: "Success", data: updateCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//==================================================updateOrder=======================================================

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let status = req.body.status
        let orderId = req.body.orderId
        if (!validation.validObjectId(userId)) {
            return res.status(400).send({ status: false, message: "invalid user ObjectId" })
        }
        if (!validation.isValid(orderId)) {
            return res.status(400).send({ status: false, message: "please enter the orderId" })
        }
        if (!validation.validObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "please enter the valid type of orderId" })
        }
        let user = await userModel.findById({ _id: userId })
        if (!user) {
            return res.status(404).send({ status: false, message: "no user found" })
        }

        if (userId != req.userid) {
            return res.status(403).send({ status: false, message: " unautorized user" })
        }
        let orderStatus = await orderModel.findOne({ userId: userId, _id: orderId })
        if (!orderStatus) {
            return res.status(404).send({ status: false, message: "no order for this user" })
        }
        if (!validation.isValid(status)) {
            return res.status(400).send({ status: false, message: "enter status to update" })
        }
        if (orderStatus.status == 'completed') {
            return res.status(400).send({ status: false, message: "your order is already completed, you can't change the status" })
        }
        if (orderStatus.status == 'cancled') {
            return res.status(400).send({ status: false, message: "you already cancled your order" })
        }
        if (orderStatus.cancellable == true) {
            //console.log(orderStatus.cancellable)
            if (!['pending', 'completed', 'cancled'].includes(status)) {
                return res.status(400).send({ status: false, message: "status can be pending|completed|cancled" })
            }
            let updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: updatedOrder })
        }
        else {
            if (!(['pending', 'completed', 'cancled'].includes(status))) {
                return res.status(400).send({ status: false, message: 'status can be pending|completed' })
            }
            if ('cancled'.includes(status)) {
                return res.status(400).send({ status: false, message: 'This order can not cancled' })
            }
            let updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: updatedOrder })
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createOrder, updateOrder }