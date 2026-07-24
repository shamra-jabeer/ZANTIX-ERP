import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  singletonKey: { type: String, default: "SETTINGS", unique: true },
  categories: { type: [String], default: ["Accessories", "Toys", "Cosmetics"] },
  staffUsers: [{
    email: { type: String, required: true },
    pin: { type: String, required: true },
    name: { type: String, required: true }
  }]
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
