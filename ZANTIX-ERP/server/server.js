import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import Product from './models/Product.js';
import Supplier from './models/Supplier.js';
import Invoice from './models/Invoice.js';
import Notification from './models/Notification.js';
import SMSLog from './models/SMSLog.js';
import Settings from './models/Settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB database successfully!');
    await seedDatabase();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// Seeding function
async function seedDatabase() {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const DEFAULT_PRODUCTS = [
        { id: 1, name: "Teddy Bear", brand: "Lego", category: "Toys", variants: [{ size: "Standard", stock: 15, sellingPrice: 2500, purchasePrice: 1500 }], image: null, warehouseCode: "WH-A1-T5" },
        { id: 2, name: "Lipstick", brand: "Dove", category: "Cosmetics", variants: [{ size: "Standard", stock: 30, sellingPrice: 950, purchasePrice: 500 }], image: null, warehouseCode: "WH-B3-L1" },
        { id: 3, name: "Hand Bag", brand: "Fashion House", category: "Accessories", variants: [{ size: "Small", stock: 12, sellingPrice: 3500, purchasePrice: 2000 }, { size: "Large", stock: 8, sellingPrice: 4200, purchasePrice: 2500 }], image: null, warehouseCode: "WH-C2-H8" },
        { id: 4, name: "Perfume", brand: "Dove", category: "Cosmetics", variants: [{ size: "100ml", stock: 3, sellingPrice: 2500, purchasePrice: 1500 }, { size: "450ml", stock: 10, sellingPrice: 4500, purchasePrice: 3000 }], image: null, warehouseCode: "WH-B4-P3" },
        { id: 5, name: "Toy Car", brand: "Lego", category: "Toys", variants: [{ size: "Standard", stock: 2, sellingPrice: 1200, purchasePrice: 800 }], image: null, warehouseCode: "WH-A2-C4" },
      ];
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log('Database seeded with default products.');
    }

    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      const DEFAULT_SUPPLIERS = [
        { id: 1, name: "Guangzhou Toys Co.", contact: "Li Wei", email: "sales@gztoys.cn", phone: "+86 138 0013 8000", category: "Toys", countryOfImport: "China" },
        { id: 2, name: "Emirates Beauty Trading", contact: "Ahmed Al Maktoum", email: "info@emiratesbeauty.ae", phone: "+971 50 123 4567", category: "Cosmetics", countryOfImport: "Dubai (UAE)" },
        { id: 3, name: "Mumbai Leather Exports", contact: "Rajesh Kumar", email: "export@mumbaileather.in", phone: "+91 98 7654 3210", category: "Accessories", countryOfImport: "India" },
      ];
      await Supplier.insertMany(DEFAULT_SUPPLIERS);
      console.log('Database seeded with default suppliers.');
    }

    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0) {
      const DEFAULT_INVOICES = [
        {
          id: "INV-1001",
          customer: { shopName: "City Retail Mart", ownerName: "Nimal Perera", contactNumber: "0771234567", address: "123 Main St, Colombo", email: "cityretail@example.com" },
          date: "2026-06-01",
          items: [{ category: "Toys", brand: "Lego", name: "Teddy Bear", size: "Standard", price: 2500, qty: 2 }],
          total: 5000,
          status: "Paid",
        },
        {
          id: "INV-1002",
          customer: { shopName: "Beauty Zone Boutique", ownerName: "Ayesha Silva", contactNumber: "0777654321", address: "45 Galle Rd, Colombo", email: "beautyzone@example.com" },
          date: "2026-06-02",
          items: [{ category: "Cosmetics", brand: "Dove", name: "Lipstick", size: "100 ml", price: 950, qty: 3 }],
          total: 2850,
          status: "Pending",
        },
        {
          id: "INV-1003",
          customer: { shopName: "Fashion Outlet", ownerName: "Kamal Fernando", contactNumber: "0779998888", address: "78 Kandy Rd, Kelaniya", email: "fashionoutlet@example.com" },
          date: "2026-06-03",
          items: [{ category: "Accessories", brand: "Fashion House", name: "Hand Bag", size: "Small", price: 3500, qty: 1 }],
          total: 3500,
          status: "Paid",
        },
      ];
      await Invoice.insertMany(DEFAULT_INVOICES);
      console.log('Database seeded with default invoices.');
    }

    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      const products = await Product.find({});
      const lowStockVariants = [];
      products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => {
            if (Number(v.stock) < 5) {
              lowStockVariants.push({ productName: p.name, size: v.size, stock: v.stock, id: p.id });
            }
          });
        }
      });
      const initialNotifications = lowStockVariants.map((v, idx) => ({
        id: `notif-${v.id}-${idx}`,
        title: `Low Stock Alert`,
        description: `"${v.productName} (${v.size})" has only ${v.stock} units remaining.`,
        time: "System Init",
        unread: true,
        type: "warning"
      }));
      if (initialNotifications.length > 0) {
        await Notification.insertMany(initialNotifications);
        console.log('Database seeded with initial notifications.');
      }
    }

    // Seed Settings (categories & staff)
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        singletonKey: "SETTINGS",
        categories: ["Accessories", "Toys", "Cosmetics"],
        staffUsers: []
      });
      console.log('Database seeded with default settings.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// API Routes
// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    let updatedProduct;
    if (productData.id) {
      updatedProduct = await Product.findOneAndUpdate(
        { id: productData.id },
        productData,
        { new: true }
      );
    } else {
      productData.id = Date.now();
      updatedProduct = new Product(productData);
      await updatedProduct.save();
    }
    
    // Check for low stock notification trigger
    let hasLowStock = false;
    let lowStockMessages = [];
    if (updatedProduct.variants && updatedProduct.variants.length > 0) {
      updatedProduct.variants.forEach(v => {
        if (Number(v.stock) < 5) {
          hasLowStock = true;
          lowStockMessages.push(`"${updatedProduct.name} (${v.size})" has only ${v.stock} units`);
        }
      });
    }

    if (hasLowStock) {
      const newNotif = new Notification({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: "Low Stock Alert",
        description: lowStockMessages.join(", "),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true,
        type: "warning"
      });
      await newNotif.save();

      // Dispatch SMS Log warning to manager
      const newSMS = new SMSLog({
        id: `sms-${Date.now()}`,
        to: "+94 77 123 4567",
        message: `[Zantix Warning] ${lowStockMessages.join(", ")}. Restock is suggested.`,
        status: "Delivered"
      });
      await newSMS.save();
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplierData = req.body;
    let updatedSupplier;
    if (supplierData.id) {
      updatedSupplier = await Supplier.findOneAndUpdate(
        { id: supplierData.id },
        supplierData,
        { new: true }
      );
    } else {
      supplierData.id = Date.now();
      updatedSupplier = new Supplier(supplierData);
      await updatedSupplier.save();
    }
    res.json(updatedSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await Supplier.findOneAndDelete({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoiceData = req.body;
    if (!invoiceData.id) {
      invoiceData.id = `INV-${Date.now().toString().slice(-4)}`;
    }
    const newInvoice = new Invoice(invoiceData);
    await newInvoice.save();

    // Deduct products stock
    for (const item of newInvoice.items) {
      // Find product by ID if available, otherwise by name
      const query = item.productId ? { id: Number(item.productId) } : { name: item.name };
      const product = await Product.findOne(query);
      if (product) {
        const variantIndex = product.variants.findIndex(v => v.size === item.size);
        if (variantIndex !== -1) {
          product.variants[variantIndex].stock = Math.max(0, Number(product.variants[variantIndex].stock) - Number(item.qty));
          
          // Tell mongoose that the variants array was modified since it is an array of objects
          product.markModified('variants');
          
          await product.save();

          if (Number(product.variants[variantIndex].stock) < 5) {
            const newNotif = new Notification({
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: "Low Stock Alert",
              description: `"${product.name} (${item.size})" has only ${product.variants[variantIndex].stock} units remaining.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: true,
              type: "warning"
            });
            await newNotif.save();

            // Dispatch SMS Log warning to manager
            const newSMS = new SMSLog({
              id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              to: "+94 77 123 4567",
              message: `[Zantix Warning] Product "${product.name} (${item.size})" stock level has dropped to ${product.variants[variantIndex].stock} units. Restock is suggested.`,
              status: "Delivered"
            });
            await newSMS.save();
          }
        }
      }
    }

    // Create notification for new invoice
    const newNotif = new Notification({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "New Invoice Generated",
      description: `Invoice ${newInvoice.id} created for ${newInvoice.customer.shopName} - Rs. ${newInvoice.total.toLocaleString()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: true,
      type: "success"
    });
    await newNotif.save();

    res.json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );

    const newNotif = new Notification({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "Invoice Status Updated",
      description: `Invoice ${req.params.id} has been marked as ${status}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: true,
      type: "info"
    });
    await newNotif.save();

    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  try {
    await Notification.updateMany({ unread: true }, { unread: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sms-logs', async (req, res) => {
  try {
    const logs = await SMSLog.find({}).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ singletonKey: 'SETTINGS' });
    if (!settings) {
      settings = await Settings.create({ singletonKey: 'SETTINGS', categories: ['Accessories', 'Toys', 'Cosmetics'], staffUsers: [] });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/categories', async (req, res) => {
  try {
    const { categories } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { singletonKey: 'SETTINGS' },
      { categories },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/staff', async (req, res) => {
  try {
    const { name, email, pin } = req.body;
    if (!name || !email || !pin) return res.status(400).json({ error: 'name, email, and pin are required' });
    const settings = await Settings.findOneAndUpdate(
      { singletonKey: 'SETTINGS' },
      { $push: { staffUsers: { name, email, pin } } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/settings/staff/:email', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { singletonKey: 'SETTINGS' },
      { $pull: { staffUsers: { email: req.params.email } } },
      { new: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Login verification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    const ADMIN_EMAIL = 'admin@zantix.com';
    const ADMIN_PIN = '1234';

    if (email === ADMIN_EMAIL && pin === ADMIN_PIN) {
      return res.json({ success: true, role: 'Admin', name: 'Administrator' });
    }

    const settings = await Settings.findOne({ singletonKey: 'SETTINGS' });
    if (settings) {
      const staff = settings.staffUsers.find(u => u.email === email && u.pin === pin);
      if (staff) {
        return res.json({ success: true, role: 'Staff', name: staff.name });
      }
    }
    res.status(401).json({ success: false, error: 'Invalid email or PIN. Please try again.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Variant-level delete for inventory
app.delete('/api/products/:productId/variants/:variantId', async (req, res) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.productId) });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.variants = product.variants.filter(v => v._id.toString() !== req.params.variantId);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
