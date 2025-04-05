const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  customerId: { type: String, ref: 'Customer' },
  products: [{
    productId: { type: String, ref: 'Product' },
    quantity: Number,
    priceAtPurchase: Number
  }],
  totalAmount: Number,
  orderDate: Date,
  status: String
});

module.exports = mongoose.model('Order', OrderSchema);
