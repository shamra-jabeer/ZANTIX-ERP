import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  to: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Sent', 'Delivered', 'Failed'], default: 'Delivered' }
}, { timestamps: true });

export default mongoose.model('SMSLog', smsLogSchema);
