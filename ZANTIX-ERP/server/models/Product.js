import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  size: { type: String, default: "Standard" },
  stock: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  variants: [variantSchema],
  image: { type: String, default: null },
  warehouseCode: { type: String, default: "" }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
