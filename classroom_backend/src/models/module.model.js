import mongoose, {Schema} from "mongoose";

const moduleSchema = new Schema({
    moduleName: {
        type: String,
        required: [true, "Please enter module name"],
        unique: true,
        trim: true
    },
    lecture: [
        {
            type: Schema.Types.ObjectId,
            ref: "Lecture",
        }
    ],
    note: [
        {
            type: Schema.Types.ObjectId,
            ref: "Note",
        }
    ],
    homework: [
        {
            type: Schema.Types.ObjectId,
            ref: "Homework",
        }
    ],
    classroom: {
        type: Schema.Types.ObjectId,
        ref: "Classroom",
    }
},
{
    timestamps: true
});

export const Module = mongoose.model("Module", moduleSchema);