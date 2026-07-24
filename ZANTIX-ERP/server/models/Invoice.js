import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: Number },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true }
});

const customerSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String },
  contactNumber: { type: String },
  address: { type: String },
  email: { type: String, default: "" }
});

const invoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: customerSchema,
  date: { type: String, required: true },
  items: [invoiceItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
