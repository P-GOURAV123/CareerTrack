const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../storage/jsonStore');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'development-secret', {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const user = {
      _id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      profile: {
        bio: '',
        location: '',
        portfolio: '',
        linkedin: '',
      },
      createdAt: now,
      updatedAt: now,
    };

    await store.insertUnique('users', user, 'email');

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_RECORD') {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await store.findOne('users', (record) => record.email === email);

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
