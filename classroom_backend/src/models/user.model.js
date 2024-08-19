import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    trim: true, 
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    select: false,
    trim: true,
  },
  dob: {
    type: Date,
    required: [true, "Please enter your date of birth"],
  },
  username: {
    type: String,
    required: [true, "Please enter your username"],
    lowercase: true,
    trim: true, 
    index: true,
    unique: true,
  },
  role: {
    type: String,
    required: [true, "Please enter your role"],
    enum: ["student", "teacher", "admin"],
    default: "student",
  },
  otp: {
    type: String,
  },
  otpExpireTime: {
    type: Date,
  },
  otpEmail: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    required: [true, "Please upload your photo"],
  },
  classroomID: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    }
  ],
},
{
  timestamps: true,
});

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
})

userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
      {
          _id: this._id,
          email: this.email,
          username: this.username,
          fullName: this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
  )
}
userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
      {
          _id: this._id,
          
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
  )
}

export const User = mongoose.model("User", userSchema);