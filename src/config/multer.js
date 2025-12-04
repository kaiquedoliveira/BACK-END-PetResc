const multer = require("multer");
const { campanhaStorage, animalStorage } = require("./cloudinary");

const uploadCampanha = multer({ storage: campanhaStorage });
const uploadAnimal = multer({ storage: animalStorage });

module.exports = { uploadCampanha, uploadAnimal };
