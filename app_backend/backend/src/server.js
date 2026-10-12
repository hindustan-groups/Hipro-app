const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/v1/services', require('./routes/services'));
app.use('/api/v1/requests', require('./routes/requests'));
app.use('/api/v1/quotations', require('./routes/quations'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/upload', require('./routes/upload'));
app.use('/api/v1/auth', require('./routes/auth'));

// Root endpoint - API Status
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'Hipro API Service',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    message: 'Hipro Backend API is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Hipro Backend API running on port ${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`=========================================`);
});