import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  category: { type: String, required: true },
  countryOfImport: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);
