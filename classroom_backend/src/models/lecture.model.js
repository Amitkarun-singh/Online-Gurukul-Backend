import mongoose, {Schema} from "mongoose";

const lectureSchema = new Schema(
    {
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        doubt: [
            {
                type: Schema.Types.ObjectId,
                ref: "Doubt"
            }
        ],
        module: {
            type: Schema.Types.ObjectId,
            ref: "Module",
        }
    },
    {
        timestamps:true,
    }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);