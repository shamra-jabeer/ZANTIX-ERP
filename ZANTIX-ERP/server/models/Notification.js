import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  time: { type: String, required: true },
  unread: { type: Boolean, default: true },
  type: { type: String, enum: ['warning', 'success', 'info'], default: 'info' }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
