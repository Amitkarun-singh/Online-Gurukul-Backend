import mongoose, {Schema} from "mongoose";

const noteSchema = new Schema(
    {
        notesFile : {
            type: String,
            required: [true, "Please upload a file"],
        },

        module: {
            type: Schema.Types.ObjectId,
            ref: "Module",
        }
    },
    {
        timestamps: true,
    }
);

export const Note = mongoose.model("Note", noteSchema);