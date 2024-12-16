import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Setup dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from project root
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studi-a';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
  createdAt: { type: Date, default: Date.now }
});

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      isAdmin: true
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    await User.create(adminData);
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();
