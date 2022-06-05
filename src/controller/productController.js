const validation = require('../validator/validator');
const productModel = require('../models/productModel')

//===================================================addProducts========================================================

const addProducts = async function (req, res) {
    try {
        let data = req.body
        let { title, description, price, currencyId, currencyFormat, availableSizes, installments } = data
        if (!validation.validBody(data)){
            return res.status(400).send({ status: false, message: 'Enter details of products.' })
        }
        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await validation.uploadFile(files[0])
            data.productImage = uploadedFileURL
        }
        else {
            return res.status(400).send({ status:false,message: "file required" })
        }

        if (!validation.isValid(title))
            return res.status(400).send({ status: false, message: "Enter Title" })
        let usedTille = await productModel.findOne({ title })
        if (usedTille)
            return res.status(400).send({ status: false, message: "Title already Present" })

        if (!validation.isValid(description))
            return res.status(400).send({ status: false, message: "Enter description" })

        if (price < 0 || !validation.isValid(price) || !/\d/.test(price))
            return res.status(400).send({ status: false, message: "enter Price" })

        if (currencyId != "INR")
            return res.status(400).send({ status: false, message: "wrong CurrencyId" })

        if (currencyFormat != '₹')
            return res.status(400).send({ status: false, message: "wrong CurrencyFormat" })

        if (availableSizes <= 0 || !validation.isValid(availableSizes))
            return res.status(400).send({ status: false, message: "Add Sizes" })

        if (availableSizes) {
            let array = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < array.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                    return res.status(400).send({ status: false, message: `Available Sizes are ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
                }
            }
            if (Array.isArray(array)) {
                data.availableSizes = array
            }
        }
        if (installments < 0){
            return res.status(400).send({ status: false, message: "Bad Installments Field" })
        }

        let created = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: created })


    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================================getdata================================================================

const getdata = async function (req, res) {
    try {
        let query = req.query
        if (!validation.validBody(query)) {

            const datafound = await productModel.find({ isDeleted: false })
            if (!datafound) {
                return res.status(404).send({ status: false, message: 'Product not exist' })
            }
            return res.status(200).send({ status: true, message: "Get Products details", data: datafound })

        } else {
            const { size, name, priceGreaterThan, priceLessThan } = query

            let filter = {}

            if (!(size || name || priceGreaterThan || priceLessThan)) {
                return res.status(400).send({ status: false, message: 'provide valid filter' })
            }
            if (size) {

                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {
                    return res.status(400).send({ staus: false, message: "Pleage enter valid size" })
                }
                filter.availableSizes = size;
            }
            if (name) {
                if (!validation.isValid(name)) {
                    return res.status(400).send({ status: false, message: "Product name is required" })
                }
                filter.title = { $regex: name, $options: 'i' };
            }
            if (priceGreaterThan) {
                if (!validation.isValid(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "priceGreaterThan is required" })
                }
                if (!/^[0-9]*$/.test(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "please enter number value" })
                }
                filter.price = { $gt: priceGreaterThan };
            }
            if (priceLessThan) {
                if (!validation.isValid(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "priceLessThan is required" })
                }
                if (!/^[0-9]*$/.test(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "please enter number value" })
                }
                filter.price = { $lt: priceLessThan };
            }
            const getdata = await productModel.find({ $and: [{ isDeleted: false }, filter] }).sort({ "price": 1 })
            if (getdata.length > 0) {
                return res.status(200).send({ staus: true,message:"Success", data: getdata })
            } else {
                return res.status(404).send({ status: false, message: 'Product not exist' })
            }
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================================getProductById========================================================

const getProductById = async function (req, res) {
    try {
        let id = req.params.productId

        if (!validation.validObjectId(id)) {
            return res.status(400).send({ status: false, message: "invalid productId" })
        }
        let products = await productModel.findOne({ _id: id, isDeleted: false })
        if (!products) {
            return res.status(404).send({ status: false, message: "product not found" })
        }
        return res.status(200).send({ status: true, message: "Success", data: products })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================================updateProducts========================================================

const updateProducts = async function (req, res) {
    try {
        let id = req.params.productId
        let data = req.body
        let files = req.files
        const { title, description, price, productImage, isFreeShipping, style, installments, availableSizes } = data
        if (!validation.validObjectId(id)) {
            return res.status(400).send({ status: false, message: "not a valid onjectId" })
        }
        let product = await productModel.findOne({ _id: id, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: "no product found with this id" })
        }
        if (!validation.validBody(data)) {
            return res.status(400).send({ status: false, message: "please provide data to update" })
        }
        if ((title && !validation.isValid(title)) || title == "") {
            return res.status(400).send({ status: false, message: "please enter title" })
        }
        let sameTitle = await productModel.findOne({ title })
        if (sameTitle) {
            return res.status(400).send({ status: false, message: " title is already used" })
        }

        if ((description && !validation.isValid(description)) || description == "") {
            return res.status(400).send({ status: false, message: "please enter description" })
        }
        if ((price && !validation.isValid(price)) || price == "") {
            return res.status(400).send({ status: false, message: "please enter price" })
        }
    
        if (price && (price < 0 || !/\d/.test(price))) {
            return res.status(400).send({ status: false, message: "enter Price" })
        }

        if (availableSizes &&  !validation.isValid(availableSizes) ||availableSizes == "") {
            return res.status(400).send({ status: false, message: "Add Sizes" })
        }

        if (availableSizes && ! /(S|XS|M|X|L|XXL|XL)$/.test(availableSizes)) {
            return res.status(400).send({ status: false, message: "Sizes only includes ['S', 'XS','M','X', 'L','XXL', 'XL']" })
        }

        if (installments && (!validation.isValid(installments)) || installments == "") {
            return res.status(400).send({ status: false, message: "please enter installments" })
        }
        if (style && (!validation.isValid(style) || !/\w/.test(style))) {
            return res.status(400).send({ status: false, message: "enter style" })
        }

        if (isFreeShipping && (!validation.isValid(isFreeShipping) || !/true|false/.test(isFreeShipping))) {
            return res.status(400).send({ status: false, message: "enter is FreeShipping" })
        }

        if (files && files.length > 0) {
            let uploadedFileURL = await validation.uploadFile(files[0])
            productImage = uploadedFileURL
        }

        let updateData = await productModel.findByIdAndUpdate({ _id: id }, data, { new: true })
        return res.status(200).send({ status: true, message: "successfully updates", data: updateData })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================================deleteProduct========================================================

const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!validation.validObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid ObjectId" })
        }
        let findProd = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProd) return res.status(404).send({ status: false, message: "No Product found " })

        let deletedProduct = await productModel.findOneAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        return res.status(200).send({ status: true, message: "Success",data:deletedProduct })

    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { addProducts, getdata, getProductById, updateProducts, deleteProduct }


