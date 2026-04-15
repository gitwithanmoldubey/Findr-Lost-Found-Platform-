const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const hasRealValue = (value, placeholder) => Boolean(value) && value !== placeholder;

const isCloudinaryConfigured = () => (
  hasRealValue(process.env.CLOUDINARY_CLOUD_NAME, 'YOUR_CLOUDINARY_CLOUD_NAME')
  && hasRealValue(process.env.CLOUDINARY_API_KEY, 'YOUR_CLOUDINARY_API_KEY')
  && hasRealValue(process.env.CLOUDINARY_API_SECRET, 'YOUR_CLOUDINARY_API_SECRET')
);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const storage = isCloudinaryConfigured()
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: 'lost-platform/items',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
      })
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured
};
