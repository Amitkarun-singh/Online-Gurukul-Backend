import multer from "multer";
import path from "path";
import ErrorHandler from "../middlewares/error.js";

// Multer configuration for photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // This will store the file temporarily before uploading to Cloudinary
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new ErrorHandler("Only images are allowed", 400));
    }
  },
}).single("photo");

export default upload;



// import multer from "multer";

// // Multer configuration for photo upload
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "uploads/");
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
//     },
//   });
  
//   const upload = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//       const filetypes = /jpeg|jpg|png/;
//       const mimetype = filetypes.test(file.mimetype);
//       const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
//       if (mimetype && extname) {
//         return cb(null, true);
//       } else {
//         cb(new ErrorHandler("Only images are allowed", 400));
//       }
//     },
//   }).single("photo");