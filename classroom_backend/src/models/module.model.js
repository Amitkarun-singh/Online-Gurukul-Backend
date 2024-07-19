import mongoose, {Schema} from "mongoose";
import AutoIncrementFactory from 'mongoose-sequence';

// const AutoIncrement = AutoIncrementFactory(mongoose);

const moduleSchema = new Schema({
    moduleName: {
        type: String,
        required: [true, "Please enter module name"],
        unique: true,
        trim: true
    },
    lecture: {
        type: Schema.Types.ObjectId,
        ref: "Lecture",
    },
    noteFile: [
        {
            id: { type: Number, default: 0 },
            url: { type: String, required: true } //cloudinary url
        }
    ]
},
{
    timestamps: true
});

// moduleSchema.plugin(AutoIncrement, { inc_field: 'noteFile.id' });

export const Module = mongoose.model("Module", moduleSchema);