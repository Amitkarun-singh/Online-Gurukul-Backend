import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
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
        lecture: {
            type: Schema.Types.ObjectId,
            ref: "Lecture",
            required: [true, "Please select a lecture"]
        }
    },
    {
        timestamps: true
    }
);

export const Video = mongoose.model("Video", videoSchema);