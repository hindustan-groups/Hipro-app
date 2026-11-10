const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⛔ FATAL: JWT_SECRET environment variable is not set. Auth routes will fail.');
}

// Brute-force protection: rate limit auth attempts to 20 per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ensure upload directory exists for vendor documents
const vendorUploadDir = path.join(__dirname, '../uploads/vendor-docs');
if (!fs.existsSync(vendorUploadDir)) {
  fs.mkdirSync(vendorUploadDir, { recursive: true });
}

// Save a base64 document (data URL) to the vendor-docs folder with strict MIME allowlist
function saveBase64Document(dataUrl, prefix, baseUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9\-+\/.]+);base64,(.+)$/);
    if (!matches) return null;
    const mime = matches[1].toLowerCase();
    const ALLOWED_MIMES = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf'
    };
    const ext = ALLOWED_MIMES[mime];
    if (!ext) {
      console.warn(`[Upload] Rejected unapproved base64 MIME type: ${mime}`);
      return null;
    }

    const buffer = Buffer.from(matches[2], 'base64');
    // Max 10MB document size
    if (buffer.length > 10 * 1024 * 1024) {
      console.warn('[Upload] Rejected oversized base64 document');
      return null;
    }

    const fileName = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(vendorUploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    const host = baseUrl || process.env.BASE_URL || '';
    return `${host.endsWith('/') ? host.slice(0, -1) : host}/uploads/vendor-docs/${fileName}`;
  } catch (e) {
    console.error('saveBase64Document error:', e.message);
    return null;
  }
}

// POST /api/v1/auth/google - Authenticate using verified Google ID token
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { idToken, id_token, credential, googleId, email } = req.body;
    const tokenToVerify = idToken || id_token || credential;

    let verifiedEmail = null;
    let verifiedGoogleId = null;
    let verifiedName = req.body.name || 'Google User';
    let verifiedPhotoUrl = req.body.photoUrl || null;

    if (tokenToVerify) {
      // 1. Verify token server-side with Google OAuth API
      try {
        const gRes = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenToVerify)}`,
          { timeout: 6000 }
        );
        const payload = gRes.data;

        if (!payload || !payload.sub || !payload.email) {
          return res.status(401).json({
            success: false,
            message: 'Invalid Google token payload: missing identity claims.'
          });
        }

        if (payload.email_verified !== 'true' && payload.email_verified !== true) {
          return res.status(403).json({
            success: false,
            message: 'Google email address is not verified by Google.'
          });
        }

        verifiedGoogleId = payload.sub;
        verifiedEmail = payload.email.toLowerCase().trim();
        verifiedName = payload.name || verifiedName;
        verifiedPhotoUrl = payload.picture || verifiedPhotoUrl;
      } catch (gErr) {
        console.warn('[GoogleAuth] Token verification failed:', gErr.response?.data || gErr.message);
        return res.status(401).json({
          success: false,
          message: 'Failed to verify Google identity token with Google authentication servers.'
        });
      }
    } else if (process.env.NODE_ENV !== 'production' && googleId && email) {
      // In local dev/test only: allow fallback if explicitly running in development
      console.warn('⚠️ [GoogleAuth] Development fallback used: verifying client-supplied credentials without idToken');
      verifiedGoogleId = googleId;
      verifiedEmail = email.toLowerCase().trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google idToken is required for secure authentication.'
      });
    }

    // 2. Query user strictly by verified Google ID or verified Email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: verifiedGoogleId },
          { email: verifiedEmail }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: verifiedName,
          email: verifiedEmail,
          googleId: verifiedGoogleId,
          photoUrl: verifiedPhotoUrl,
          authProvider: 'google',
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: verifiedGoogleId,
          photoUrl: verifiedPhotoUrl || user.photoUrl,
          authProvider: 'google',
        }
      });
    }

    // 3. Issue signed JWT session token
    const token = jwt.sign(
      { id: user.id, role: user.role || 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
});

// POST /api/v1/auth/register (Standard Name/Email/Password Signup)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Email, password, and phone number are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingemail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingemail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login.' });
    }

    const existingnum = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });
    if (existingnum) {
      return res.status(400).json({ success: false, message: 'An account with this phone number already exists. Please login.' });
    }

    // Hash password with bcryptjs before saving to database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : 'Customer',
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phoneNumber: phoneNumber.trim(),
        authProvider: 'email'
      }
    });

    const token = jwt.sign({ id: newUser.id, role: 'CUSTOMER' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        authProvider: newUser.authProvider
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: 'Internal server error' });
  }
});

// POST /api/v1/auth/login (Standard Email/Password)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Secure bcrypt comparison
    let passwordMatches = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plaintext passwords are not accepted for login
      return res.status(401).json({
        success: false,
        message: 'Security update: Plaintext passwords are no longer supported. Please reset your password.'
      });
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role || 'CUSTOMER' }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role || 'CUSTOMER'
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed', error: 'Internal server error' });
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

// ==========================================
// ==========================================
// SUPER ADMIN & VENDOR ACCESS CONTROL AUTH
// Authenticates credentials directly from the database
// ==========================================

// POST /api/v1/auth/admin/login - Authenticate Super Admin from DB
router.post('/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch credentials from database Admin table
    let admin = null;
    try {
      admin = await prisma.admin.findUnique({
        where: { email: cleanEmail }
      });
    } catch (e) {
      console.warn('Prisma Admin table query warning, checking user table:', e.message);
    }

    // 2. If not found in Admin table, check User table for ADMIN role
    if (!admin) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          }
        });
        if (dbUser) {
          admin = {
            id: dbUser.id,
            name: dbUser.name || 'Super Administrator',
            email: dbUser.email,
            password: dbUser.password,
            role: dbUser.role || 'ADMIN',
            isActive: true
          };
        }
      } catch (e) {
        console.warn('Prisma User admin check warning:', e.message);
      }
    }

    // 3. Validate credentials
    if (!admin || !admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid administrator credentials.'
      });
    }

    if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
      return res.status(401).json({
        success: false,
        message: 'Security update: Administrator password must be securely hashed. Please reset password via CLI.'
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid administrator password.'
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Administrator account is deactivated. Contact system admin.'
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role || 'ADMIN'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Super Admin authenticated successfully from database credentials',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'ADMIN'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Admin authentication failed', error: 'Internal server error' });
  }
});

// POST /api/v1/auth/vendor/login - Authenticate Vendor & Operator from DB
router.post('/vendor/login', authLimiter, async (req, res) => {
  try {
    const { phone, email, passcode, category } = req.body;
    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Vendor phone number or email is required' });
    }

    const contactInput = (phone || email || '').trim();
    const cleanPhone = contactInput.replace(/\D/g, '');

    let vendor = null;

    // 1. Fetch vendor credentials directly from database Vendor table
    try {
      vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            ...(cleanPhone.length >= 10 ? [{ phone: { contains: cleanPhone.slice(-10) } }] : []),
            ...(contactInput.includes('@') ? [{ email: { equals: contactInput, mode: 'insensitive' } }] : [])
          ]
        }
      });
    } catch (dbErr) {
      console.warn('Database vendor lookup error, checking active cache:', dbErr.message);
    }

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No vendor or operator is registered with this contact. Please register a new account.'
      });
    }

    // Category verification (if specific category was requested by user)
    if (category && category !== 'All' && vendor.category) {
      const selectedCategoryNorm = category.trim().toLowerCase();
      const vendorCategoryNorm = vendor.category.trim().toLowerCase();
      if (selectedCategoryNorm !== vendorCategoryNorm) {
        return res.status(400).json({
          success: false,
          message: `This account is registered under ${vendor.category}, not ${category}. Please switch to the ${vendor.category} tab.`
        });
      }
    }

    // 3. Security PIN / Passcode Verification from DB (Strictly Required)
    if (!passcode || typeof passcode !== 'string' || !passcode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vendor security PIN / passcode is required.'
      });
    }

    if (!vendor.passcode) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No security PIN has been established for this account.'
      });
    }

    let pinMatches = false;
    if (vendor.passcode.startsWith('$2a$') || vendor.passcode.startsWith('$2b$')) {
      pinMatches = await bcrypt.compare(passcode.trim(), vendor.passcode);
    } else {
      pinMatches = vendor.passcode === passcode.trim() || vendor.password === passcode.trim();
      if (pinMatches) {
        try {
          const hashed = await bcrypt.hash(passcode.trim(), 10);
          await prisma.vendor.update({
            where: { id: vendor.id },
            data: { passcode: hashed }
          });
        } catch (e) {}
      }
    }
    if (!pinMatches) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid security PIN / passcode.'
      });
    }

    // 4. Check vendor active status
    if (vendor.status && vendor.status.toLowerCase() === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your vendor account is currently inactive. Contact Super Admin desk.'
      });
    }

    const token = jwt.sign(
      {
        id: vendor.id,
        vendorId: vendor.id,
        name: vendor.name,
        businessName: vendor.businessName,
        phone: vendor.phone,
        category: vendor.category || 'Services',
        role: 'VENDOR'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Vendor authenticated successfully',
      token,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        businessName: vendor.businessName,
        phone: vendor.phone,
        email: vendor.email,
        city: vendor.city,
        category: vendor.category || 'Services',
        specialization: vendor.specialization,
        rating: vendor.rating,
        status: vendor.status || 'active',
        role: 'VENDOR'
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ success: false, message: 'Vendor authentication failed', error: 'Internal server error' });
  }
});

// POST /api/v1/auth/vendor/register - Self-onboarding registration for new vendors / operators
router.post('/vendor/register', authLimiter, async (req, res) => {
  try {
    const {
      name,
      businessName,
      phone,
      email,
      category, // 'Adventure' | 'Services'
      state,
      city,
      specialization,
      experience,
      passcode,
      aadhaarNumber,
      panNumber,
      aadhaarFile,      // base64 data URL
      panFile,          // base64 data URL
      bankPassbookFile  // base64 data URL
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Contact person name is required' });
    }
    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ success: false, message: 'Business or operator name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile phone number is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'Operating city is required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    // Security passcode is mandatory for vendor account activation
    if (!passcode || !passcode.trim()) {
      return res.status(400).json({ success: false, message: 'Security PIN is required' });
    }
    const cleanPasscode = passcode.trim();
    if (cleanPasscode.length < 4 || cleanPasscode.length > 6) {
      return res.status(400).json({ success: false, message: 'Security PIN must be between 4 and 6 digits' });
    }
    if (!/^\d+$/.test(cleanPasscode)) {
      return res.status(400).json({ success: false, message: 'Security PIN must contain only digits' });
    }

    // Validate Aadhaar number (12 digits) if provided
    if (aadhaarNumber && aadhaarNumber.trim()) {
      const cleanAadhaar = aadhaarNumber.trim().replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({ success: false, message: 'Aadhaar number must be 12 digits' });
      }
    }

    // Validate PAN number (format: 5 letters + 4 digits + 1 letter) if provided
    if (panNumber && panNumber.trim()) {
      const cleanPan = panNumber.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        return res.status(400).json({ success: false, message: 'Invalid PAN number format' });
      }
    }

    // Document files are optional for vendor verification
    // Determine base URL for document links
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    // Save uploaded documents (optional — process only if provided)
    const aadhaarUrl = aadhaarFile ? saveBase64Document(aadhaarFile, 'aadhaar', baseUrl) : null;
    const panUrl = panFile ? saveBase64Document(panFile, 'pan', baseUrl) : null;
    const bankPassbookUrl = bankPassbookFile ? saveBase64Document(bankPassbookFile, 'bank-passbook', baseUrl) : null;

    const selectedCategory = (category && category.trim().toLowerCase() === 'adventure') ? 'Adventure' : 'Services';

    // Check if phone or email already registered
    const existing = await prisma.vendor.findFirst({
      where: {
        OR: [
          { phone: { contains: cleanPhone.slice(-10) } },
          ...(email && email.trim() ? [{ email: { equals: email.trim(), mode: 'insensitive' } }] : [])
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A partner account with this phone number or email is already registered. Please log in.'
      });
    }

    // Hash security passcode
    const hashedPasscode = await bcrypt.hash(cleanPasscode, 10);

    const newVendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        email: (email && email.trim()) || null,
        category: selectedCategory,
        state: (state && state.trim()) || null,
        city: city.trim(),
        specialization: (specialization && specialization.trim()) || (selectedCategory === 'Adventure' ? 'Adventure Activities & Tours' : 'Construction & Home Services'),
        experience: (experience && experience.trim()) || '1+ Years',
        passcode: hashedPasscode,
        status: 'active',
        rating: 5.0,
        minCharge: selectedCategory === 'Adventure' ? 1200 : 500,
        // Document verification fields
        aadhaarNumber: aadhaarNumber ? aadhaarNumber.trim().replace(/\s/g, '') : null,
        aadhaarUrl,
        panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
        panUrl,
        bankPassbookUrl,
        documentsVerified: false
      }
    });

    // Sign JWT session token
    const token = jwt.sign(
      {
        id: newVendor.id,
        vendorId: newVendor.id,
        name: newVendor.name,
        businessName: newVendor.businessName,
        phone: newVendor.phone,
        category: newVendor.category,
        role: 'VENDOR'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: `Welcome to Hipro! ${newVendor.businessName} has been registered. Your documents are pending admin verification.`,
      token,
      vendor: {
        id: newVendor.id,
        name: newVendor.name,
        businessName: newVendor.businessName,
        phone: newVendor.phone,
        email: newVendor.email,
        city: newVendor.city,
        category: newVendor.category,
        specialization: newVendor.specialization,
        rating: newVendor.rating,
        status: newVendor.status,
        documentsVerified: newVendor.documentsVerified,
        role: 'VENDOR'
      }
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message ? `Vendor registration failed: ${error.message}` : 'Vendor registration failed',
      error: error.message
    });
  }
});

module.exports = router;
