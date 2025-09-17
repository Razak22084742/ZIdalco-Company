const bcrypt = require('bcryptjs');

// In-memory user database (in production, this would be a real database)
let users = [
  {
    id: 1,
    name: 'Admin',
    email: 'zidalcoltd@gmail.com',
    // password: Admin123 (pre-hashed)
    password: '$2a$10$NWObY6aLxZRBJbBTv1N9eO7QK9y9wOA5X0b2aU5a7Z7hpx9L4V4dS',
    role: 'admin',
    created_at: new Date().toISOString()
  }
];

// Hash password function
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Find user by email
function findUserByEmail(email) {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
function findUserById(id) {
  return users.find(user => user.id === parseInt(id));
}

// Create new user
async function createUser(userData) {
  const { name, email, password } = userData;
  
  // Check if user already exists
  if (findUserByEmail(email)) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
    created_at: new Date().toISOString()
  };
  
  users.push(newUser);
  return newUser;
}

// Verify password
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Authenticate user
async function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }
  
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return { success: false, message: 'Invalid credentials' };
  }
  
  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

// Get all users (for admin purposes)
function getAllUsers() {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at
  }));
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  authenticateUser,
  getAllUsers,
  hashPassword,
  verifyPassword
};
