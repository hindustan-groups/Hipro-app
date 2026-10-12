const express = require('express');
const router =  express.Router();
const path = require('path');

const multer = require('multer');
const {uploadToImageKit,GetAuthenticationParameters} = require('../services/imagekit');
// const { data } = require('autoprefixer');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits:{fileSize:60*1024*1024},
    fileFilter:(req,file,cb)=>{
        const mime = file.mimetype || '';
        if (mime.startsWith('image/') ||
        mime.startsWith('video/') ||
        mime.startsWith('audio/') ||
        file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|mpeg|mp3|wav|m4a|aac)$/i)
    ) {
            cb(null,true);
        }
        else{
            cb(new Error('Unsupported file type. Please upload an image, short video, or audio file.'),false);
        }
    }
});


router.post('/',upload.single('file'),async (req,res)=>{
    try{
        if (!req.file) {
            return res.status(400).json({
                success:false,
                message:'No image file provided'
            });
        }
        const folder = req.body.folder || '/inspections';
        let mediatype = 'IMAGE';
        const mime = req.file.mimetype || '';
        if (mime.startsWith('video/') || req.file.originalname.match(/\.(mp4|mov|mpeg)$/i) ) {
            mediatype = 'VIDEO';
        } else if (mime.startsWith('audio/') || req.file.originalname.match(/\.(mp3|wav|m4a)$/i)){
            mediatype = 'AUDIO';
        }
        const ext = path.extname(req.file.originalname) || (mediatype === 'VIDEO' ? '.mp4' :mediatype === 'AUDIO' ? '.m4a':'.jpg'
        );
        const fileName = req.file.originalname || `image_${Date.now()}.jpg`;
        const result = await uploadToImageKit(req.file.buffer,fileName,folder);
        res.json({
            success:true,
            message:'image uploaded successfully ',
            data:result
        })
    }
    catch(error){
       console.error('ImageKit Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to ImageKit'
    });   
}   
})

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