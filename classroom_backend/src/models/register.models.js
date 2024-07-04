import mongoose from 'mongoose';

const registerSchema = new mongoose.Schema({
    
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true
    },
    dob: {
        type: Date,
        required: true
    },
    createdAt: {
    type: Date,
    default: Date.now,
    },
});



const User = mongoose.model('User', registerSchema);

export default User;
