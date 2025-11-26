const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let folderName = 'petresc_animais'; 
        
        if (file.fieldname === 'imagem_resgate') {
            folderName = 'petresc_resgate';
        }
        
        return {
            folder: folderName, 
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id: `${file.fieldname}-${Date.now()}`
        };
    },
});
module.exports = storage;