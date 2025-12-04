const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Storage para campanhas
const campanhaStorage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
        folder: "petresc_campanhas",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `campanha-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
});

// 🔹 Storage para animais
const animalStorage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
        folder: "petresc_animais",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        public_id: `animal-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
});

module.exports = {
    cloudinary,
    campanhaStorage,
    animalStorage
};