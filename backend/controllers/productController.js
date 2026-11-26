import Product from '../models/Product.js';

export async function getProducts(request, response, next) {
  try {
    const filter = request.query.category ? { category: request.query.category } : {};
    const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).lean();
    response.json({ products });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(request, response, next) {
  try {
    const product = await Product.findById(request.params.productId).populate('category', 'name').lean();
    if (!product) {
      return response.status(404).json({ message: 'Product not found.' });
    }
    return response.json({ product });
  } catch (error) {
    return next(error);
  }
}

export async function createProduct(request, response, next) {
  try {
    const rawStock = request.body.stock;
    const stock = rawStock !== undefined && rawStock !== null && rawStock !== ''
      ? Math.max(0, Math.round(Number(rawStock)))
      : null;

    const product = await Product.create({
      name: request.body.name,
      description: request.body.description,
      price: request.body.price,
      stock,
      images: request.body.images,
      category: request.body.category
    });
    await product.populate('category', 'name');
    response.status(201).json({ category: product.category, product });
  } catch (error) {
    next(error);
  }
}

export async function updateProductStock(request, response, next) {
  try {
    const rawStock = request.body.stock;
    const stock = rawStock === null || rawStock === '' || rawStock === undefined
      ? null
      : Math.max(0, Math.round(Number(rawStock)));

    if (stock !== null && Number.isNaN(stock)) {
      return response.status(400).json({ message: 'Valid stock quantity is required.' });
    }

    const product = await Product.findByIdAndUpdate(
      request.params.productId,
      { stock },
      { new: true, runValidators: true }
    ).populate('category', 'name').lean();

    if (!product) {
      return response.status(404).json({ message: 'Product not found.' });
    }

    return response.json({ product });
  } catch (error) {
    return next(error);
  }
}

export async function deleteProduct(request, response, next) {
  try {
    const product = await Product.findByIdAndDelete(request.params.productId);
    if (!product) {
      return response.status(404).json({ message: 'Product not found.' });
    }
    return response.json({ message: 'Product deleted successfully.', productId: request.params.productId });
  } catch (error) {
    return next(error);
  }
}
