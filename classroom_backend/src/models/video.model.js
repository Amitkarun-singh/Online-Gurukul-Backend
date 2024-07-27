import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,
            required: [true, "Please upload a video file"];
        },
    },
    {
        timestamps: true
    }
);

export const Video = mongoose.model("Video", videoSchema);