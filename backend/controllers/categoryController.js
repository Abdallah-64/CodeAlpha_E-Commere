import Category from '../models/Category.js';

export async function getCategories(_request, response, next) {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    response.json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(request, response, next) {
  try {
    const category = await Category.create({
      name: request.body.name,
      description: request.body.description,
      image: request.body.image || ''
    });
    response.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(request, response, next) {
  try {
    const category = await Category.findByIdAndDelete(request.params.categoryId);
    if (!category) {
      return response.status(404).json({ message: 'Category not found.' });
    }
    return response.json({ message: 'Category deleted successfully.', categoryId: request.params.categoryId });
  } catch (error) {
    return next(error);
  }
}
