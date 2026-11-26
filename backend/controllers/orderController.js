import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export async function createOrder(request, response, next) {
  try {
    const { customerName, customerEmail, shippingAddress, items, totalAmount } = request.body;
    if (!customerName || !customerEmail || !items || !items.length) {
      return response.status(400).json({ message: 'Customer details and items are required.' });
    }

    // Verify and deduct stock for tracked MongoDB products
    for (const item of items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) continue;
      const qty = Math.max(1, Number(item.quantity || 1));
      const product = await Product.findById(item.productId);
      if (product && product.stock !== null && product.stock !== undefined) {
        if (product.stock < qty) {
          return response.status(400).json({
            message: product.stock === 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stock} left in stock for "${product.name}".`
          });
        }
        product.stock = Math.max(0, product.stock - qty);
        await product.save();
      }
    }

    const calculatedTotal = Number(totalAmount) || items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);

    const order = await Order.create({
      customerName,
      customerEmail,
      shippingAddress: shippingAddress || 'Standard delivery',
      items,
      totalAmount: calculatedTotal,
      status: 'paid'
    });

    return response.status(201).json({ message: 'Order placed successfully.', order });
  } catch (error) {
    return next(error);
  }
}

export async function getOrders(_request, response, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return response.json({ orders });
  } catch (error) {
    return next(error);
  }
}
