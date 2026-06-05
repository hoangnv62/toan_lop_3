import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ file .xlsx hoặc .xls'), false);
  }
};

export const upload = multer({ storage, fileFilter });
