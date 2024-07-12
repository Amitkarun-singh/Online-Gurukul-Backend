import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    select: false,
  },
  dob: {
    type: Date,
    required: [true, "Please enter your date of birth"],
  },
  emailId: {
    type: String,
    required: [true, "Please enter your email ID"],
  },
  username: {
    type: String,
    required: [true, "Please enter your username"],
    unique: true,
  },
  role: {
    type: String,
    required: [true, "Please enter your role"],
    enum: ["user", "teacher", "admin"],
    default: "user",
  },
  photo: {
    type: String,
    required: [true, "Please upload your photo"],
  },
  
});

const User = mongoose.model("User", userSchema);

export default User;





// import mongoose from 'mongoose';

// const registerSchema = new mongoose.Schema({
    
//     role: {
//         type: String,
//         enum: ['admin', 'teacher', 'student'],
//         required: true
//     },
//     photo: {
//         type: String,
//         required: true
//     },
//     username: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     emailId: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     dob: {
//         type: Date,
//         required: true
//     },
//     createdAt: {
//     type: Date,
//     default: Date.now,
//     },
// });



// const User = mongoose.model('User', registerSchema);

// export default User;
