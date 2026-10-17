const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// POST /api/v1/auth/google
router.post('/google', async (req, res) => {
  try {
    const { name, email, googleId, photoUrl } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success:false,
        message:'Email and Google ID are required'
      })
      
    }
    
    // Check if user already exists by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { googleId: googleId }
        ]
      }
    });

    if (!user) {
      // If they don't exist, create a new user dynamically!
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email: email,
          googleId: googleId,
          photoUrl: photoUrl,
          authProvider: 'google',
        }
      });
    } else {
       // Optionally update the existing user with google info if it was a local user
       if (!user.googleId) {
          user = await prisma.user.update({
             where: { id: user.id },
             data: {
                googleId: googleId,
                photoUrl: photoUrl,
                authProvider: 'google',
             }
          });
       }
    }

    // Generate an Auth Token for the app
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      success: true,
      token,
      user :{
        id: user.id,
        name: user.name,
        email:user.email,
        phoneNumber:user.phoneNumber,
        photoUrl:user.photoUrl,
        authProvider: user.authProvider,
        
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST /api/v1/auth/register (Standard Name/Email/Password Signup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
   

    if (!email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Email and password and phone number are required' });
    }

    // Check if user already exists
    const existingemail = await prisma.user.findUnique({
      where: 
          { 
            email: email,
           
           },
    });
    if (existingemail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }
  const existingnum = await prisma.user.findUnique({
      where: 
          { 
            phoneNumber: phoneNumber,
           
           },
    });
    if (existingnum) {
      return res.status(400).json({ success: false, message: 'An account with this phonenumber already exists. Please login.' });
    }
  
    const newUser = await prisma.user.create({
      data: {
        name: name ,
        email,
        password,
        phoneNumber: phoneNumber ,
        authProvider: 'email'
      }
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// POST /api/v1/auth/login (Standard Email/Password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches 
    // IMPORTANT: In production, compare hashed passwords!
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || !JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Please login to continue'
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again'
    });
  }
}

// PATCH /api/v1/auth/phone - Save or update user phone number
router.patch('/phone', authenticateUser, async (req, res) => {
  try {
    const phoneNumber = String(req.body.phoneNumber || '').trim();

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number'
      });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { phoneNumber },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Mobile number saved successfully',
      user
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered'
      });
    }

    console.error('Save phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save mobile number',
      error: error.message
    });
  }
});

module.exports = router;
