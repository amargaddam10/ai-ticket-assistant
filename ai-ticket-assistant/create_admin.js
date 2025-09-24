const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path if needed

// --- IMPORTANT ---
// PASTE YOUR FULL MONGODB CONNECTION STRING FROM YOUR .env FILE BELOW
const MONGO_URI =
  'mongodb+srv://myUser:Amarpass@cluster0.mr6rwjz.mongodb.net/?retryWrites=true&w=majority&appName=cluster0';

async function createAdminUser() {
  if (!MONGO_URI.startsWith('mongodb')) {
    console.error(
      'Error: The MONGO_URI variable is not set correctly. Please paste your full connection string into the script.'
    );
    process.exit(1);
  }

  try {
    // Connect to the database using the hardcoded URI
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected to Atlas cloud for admin creation.');

    // Check if an admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists. Exiting.');
      mongoose.connection.close();
      return;
    }

    // Create the new admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'password123',
      role: 'admin',
      skills: [],
      isActive: true,
    });

    // The 'pre-save' hook in your User model will automatically hash the password
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
    console.log('   Please change this password after your first login.');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Ensure the database connection is closed
    mongoose.connection.close();
  }
}

createAdminUser();
