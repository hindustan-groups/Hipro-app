const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// POST /api/v1/auth/google
router.post('/google', async (req, res) => {
  try {
    const { name, email, googleId, photoUrl } = req.body;
    
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
      user
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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

module.exports = router;
