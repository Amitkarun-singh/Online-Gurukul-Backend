import mongoose, {Schema} from "mongoose";

const doubtSchema = new Schema(
    {
        doubtDescription: {
            type: String,
            required: [true, "Please enter your doubt"]
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: [true, "Please enter video id"]
        },
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please enter student id"]
        },
        lecture: {
            type: Schema.Types.ObjectId,
            ref: "Lecture",
            required: [true, "Please enter module id"]
        },
        replies: [
            {
                replyDescription: {
                    type: String,
                },
                replier:{
                    type: Schema.Types.ObjectId,
                    ref: "User"
                },
                createdAt:{
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

export const Doubt = mongoose.model("Doubt", doubtSchema);