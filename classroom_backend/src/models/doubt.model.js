import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
    {
        doubtDescription: {
            type: String,
            required: [true, "Please enter your doubt"]
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: [true, "Please enter video id"]
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please enter student id"]
        },
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: [true, "Please enter module id"]
        },
    },
    {
        timestamps: true
    }
);

export const Doubt = mongoose.model("Doubt", doubtSchema);