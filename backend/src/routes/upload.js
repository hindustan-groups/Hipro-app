const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const multer = require('multer');
const { uploadToImageKit, GetAuthenticationParameters } = require('../services/imagekit');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 60 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const mime = file.mimetype || '';
        if (mime.startsWith('image/') ||
            mime.startsWith('video/') ||
            mime.startsWith('audio/') ||
            file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|mpeg|mp3|wav|m4a|aac)$/i)
        ) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload an image, short video, or audio file.'), false);
        }
    }
});

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }
        const folder = req.body.folder || '/inspections';
        let mediatype = 'IMAGE';
        const mime = req.file.mimetype || '';
        if (mime.startsWith('video/') || req.file.originalname.match(/\.(mp4|mov|mpeg)$/i)) {
            mediatype = 'VIDEO';
        } else if (mime.startsWith('audio/') || req.file.originalname.match(/\.(mp3|wav|m4a)$/i)) {
            mediatype = 'AUDIO';
        }
        const ext = path.extname(req.file.originalname) || (mediatype === 'VIDEO' ? '.mp4' : mediatype === 'AUDIO' ? '.m4a' : '.jpg');
        const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${cleanName}_${Date.now()}${ext}`;

        let result = null;
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

        // Try ImageKit if credentials are present
        if (publicKey && privateKey && urlEndpoint) {
            try {
                result = await uploadToImageKit(req.file.buffer, fileName, folder);
            } catch (ikErr) {
                console.warn('ImageKit upload failed, falling back to local storage:', ikErr.message);
            }
        }

        // Fallback to local server uploads directory
        if (!result) {
            const uploadDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);

            const host = req.get('host');
            const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
            const baseURL = process.env.BASE_URL || `${protocol}://${host}`;
            const fileUrl = `${baseURL}/uploads/${fileName}`;

            result = {
                fileId: fileName,
                url: fileUrl,
                thumbnailUrl: fileUrl,
                name: fileName,
                filePath: `/uploads/${fileName}`
            };
        }

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: result
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload file'
        });
    }
});

router.get('/auth', (req, res) => {
    try {
        const authparams = GetAuthenticationParameters();
        res.json({
            success: true,
            data: authparams
        });
    } catch (error) {
        console.error('ImageKit Auth Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get authentication parameters from ImageKit'
        });   
    }
});

module.exports = router;