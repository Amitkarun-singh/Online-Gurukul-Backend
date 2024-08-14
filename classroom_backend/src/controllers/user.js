import User from "../models/user.models.js";
import bcrypt from "bcrypt";
import { sendCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import multer from "multer";
import path from "path";

// Multer configuration for photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp/");
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

const login = async (req, res, next) => {
  try {
    const { email, password ,} = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ErrorHandler("Invalid Email or Password", 400));

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return next(new ErrorHandler("Invalid Email or Password", 400));

    sendCookie(user, res, `Welcome back, ${user.name}`, 200);
  } catch (error) {
    next(error);
  }
};

const register = (req, res, next) => {
  upload(req, res, async function (err) {
    if (err) {
      return next(err);
    }

    try {
      const { name, email, password, dob, emailId, username, role } = req.body;
      const photo = req.file ? req.file.path : null;

      if (!photo) return next(new ErrorHandler("Photo is required", 400));

      const uploadResult = await uploadOnCloudinary(photo);
      if (!uploadResult) return next(new ErrorHandler("Failed to upload photo", 500));

      const photoUrl = uploadResult.secure_url;

      let user = await User.findOne({ email });

      if (user) return next(new ErrorHandler("User Already Exist", 400));

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        dob,
        emailId,
        username,
        photo: photoUrl,
        role,
      });

      sendCookie(user, res, "Registered Successfully", 201);
    } catch (error) {
      next(error);
    }
  });
};

const getMyProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

const logout = (req, res) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    })
    .json({
      success: true,
      user: req.user,
    });
};

export { login, register, getMyProfile, logout };


// import User from "../models/user.models.js";
// import bcrypt from "bcrypt";
// import { sendCookie } from "../utils/features.js";
// import ErrorHandler from "../middlewares/error.js";
// import multer from "multer";
// import path from "path";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";




// const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select("+password");

//     if (!user) return next(new ErrorHandler("Invalid Email or Password", 400));

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) return next(new ErrorHandler("Invalid Email or Password", 400));

//     sendCookie(user, res, `Welcome back, ${user.name}`, 200);
//   } catch (error) {
//     next(error);
//   }
// };

// const register = async (req, res, next) => {
//   upload(req, res, async function (err) {
//     if (err) {
//       return next(err);
//     }

//     try {
//       const { name, email, password, dob, emailId, username, role } = req.body;
//       const photo = req.file ? req.file.path : null;

//       if (!photo) return next(new ErrorHandler("Photo is required", 400));

//       let user = await User.findOne({ email });

//       if (user) return next(new ErrorHandler("User Already Exist", 400));

//       const hashedPassword = await bcrypt.hash(password, 10);

//       user = await User.create({
//         name,
//         email,
//         password: hashedPassword,
//         dob,
//         emailId,
//         username,
//         photo,
//         role,
//       });

//       sendCookie(user, res, "Registered Successfully", 201);
//     } catch (error) {
//       next(error);
//     }
//   });
// };

// const getMyProfile = (req, res) => {
//   res.status(200).json({
//     success: true,
//     user: req.user,
//   });
// };

// const logout = (req, res) => {
//   res
//     .status(200)
//     .cookie("token", "", {
//       expires: new Date(Date.now()),
//       sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
//       secure: process.env.NODE_ENV === "Development" ? false : true,
//     })
//     .json({
//       success: true,
//       user: req.user,
//     });
// };

// export { login, register, getMyProfile, logout };





// import User from "../models/user.models.js";
// import bcrypt from "bcrypt";
// import { sendCookie } from "../utils/features.js";
// import ErrorHandler from "../middlewares/error.js";

// const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select("+password");

//     if (!user) return next(new ErrorHandler("Invalid Email or Password", 400));

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch)
//       return next(new ErrorHandler("Invalid Email or Password", 400));

//     sendCookie(user, res, `Welcome back, ${user.name}`, 200);
//   } catch (error) {
//     next(error);
//   }
// };

// const register = async (req, res, next) => {
//   try {
//     const { name, email, password } = req.body;

//     let user = await User.findOne({ email });

//     if (user) return next(new ErrorHandler("User Already Exist", 400));

//     const hashedPassword = await bcrypt.hash(password, 10);

//     user = await User.create({ name, email, password: hashedPassword });

//     sendCookie(user, res, "Registered Successfully", 201);
//   } catch (error) {
//     next(error);
//   }
// };

// const getMyProfile = (req, res) => {
//   res.status(200).json({
//     success: true,
//     user: req.user,
//   });
// };

// const logout = (req, res) => {
//   res
//     .status(200)
//     .cookie("token", "", {
//       expires: new Date(Date.now()),
//       sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
//       secure: process.env.NODE_ENV === "Development" ? false : true,
//     })
//     .json({
//       success: true,
//       user: req.user,
//     });
// };


// export {login,register,getMyProfile,logout};
