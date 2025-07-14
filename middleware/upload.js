const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Helper function to generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);
  const extension = path.extname(originalName);
  return `images-${timestamp}-${random}${extension}`;
};

// Helper function to validate file type
const isValidImageFile = (file) => {
  if (!file || !file.mimetype) {
    console.log('⚠️ File has no mimetype:', file);
    return false;
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(file.mimetype);
};

// Helper function to validate file size (10MB)
const isValidFileSize = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};

// Process uploaded files with express-fileupload
const processUploadedFiles = (files) => {
  const uploadedImages = [];
  
  if (!files || Object.keys(files).length === 0) {
    console.log('📁 No files found in request');
    return uploadedImages;
  }

  console.log('📁 Files received:', Object.keys(files));
  
  // Handle different file field names
  let fileArray = [];
  
  // Check for 'images' field (multiple files)
  if (files.images) {
    fileArray = Array.isArray(files.images) ? files.images : [files.images];
    console.log('📁 Found images field with', fileArray.length, 'files');
  }
  // Check for 'image' field (single file)
  else if (files.image) {
    fileArray = [files.image];
    console.log('📁 Found image field with 1 file');
  }
  // Fallback: process all files
  else {
    fileArray = Object.values(files);
    console.log('📁 Processing all files:', fileArray.length);
  }
  
  fileArray.forEach(file => {
    console.log('📁 Processing file:', file.name, 'Size:', file.size, 'bytes', 'Type:', file.mimetype);
    
    // Skip if file is undefined or has no name
    if (!file || !file.name) {
      console.log('⚠️ Skipping invalid file:', file);
      return;
    }
    
    // Validate file type
    if (!isValidImageFile(file)) {
      console.log('❌ Invalid file type:', file.name, 'Type:', file.mimetype);
      throw new Error(`Invalid file type: ${file.name}. Only image files are allowed.`);
    }
    
    // Validate file size
    if (!isValidFileSize(file)) {
      console.log('❌ File too large:', file.name, 'Size:', file.size);
      throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
    }
    
    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filepath = path.join(uploadsDir, filename);
    
    console.log('📁 Saving file to:', filepath);
    
    // Move file to uploads directory
    file.mv(filepath, (err) => {
      if (err) {
        console.error('❌ Error saving file:', err);
        throw new Error(`Error saving file: ${file.name}`);
      }
      console.log('✅ File saved successfully:', filename);
    });
    
    uploadedImages.push(`/uploads/${filename}`);
  });
  
  return uploadedImages;
};

// Middleware to handle file uploads
const handleFileUpload = (req, res, next) => {
  try {
    console.log('📁 Processing file upload...');
    console.log('📁 Files in request:', req.files ? Object.keys(req.files) : 'No files');
    console.log('📁 Request headers:', req.headers['content-type']);
    
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('📁 No files uploaded, continuing...');
      return next();
    }
    
    // Process uploaded files
    const uploadedImages = processUploadedFiles(req.files);
    
    // Add uploaded images to request body
    if (uploadedImages.length > 0) {
      req.body.uploadedImages = uploadedImages;
      console.log('📁 Added uploaded images to request body:', uploadedImages);
    }
    
    next();
  } catch (error) {
    console.error('🚨 File upload error:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  console.log('🚨 Upload error:', err.message);
  
  if (err.message.includes('File too large')) {
    return res.status(400).json({
      status: 'error',
      message: 'File too large. Maximum size is 10MB.'
    });
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      status: 'error',
      message: 'Only image files are allowed!'
    });
  }
  
  if (err.message.includes('Error saving file')) {
    return res.status(500).json({
      status: 'error',
      message: 'Error saving file. Please try again.'
    });
  }
  
  next(err);
};

module.exports = {
  processUploadedFiles,
  handleFileUpload,
  handleUploadError,
  generateUniqueFilename,
  isValidImageFile,
  isValidFileSize
}; 