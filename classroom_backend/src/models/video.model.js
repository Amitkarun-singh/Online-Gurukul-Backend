import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please enter title"],
            trim: true
        },
        videoFile: {
            type: String,
            required: [true, "Please upload a video file"]
        },
    },
    {
        timestamps: true
    }
);

export const Video = mongoose.model("Video", videoSchema);