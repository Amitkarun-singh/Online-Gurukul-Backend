import mongoose, { Schema } from "mongoose";

const homeworkSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Please enter title"],
            trim: true,
        },

        description: {
            type: String,
            required: "Please enter description",
            trim: true,
        },

        homeworkFile: {
            type: String,
            required: "Please upload a file",
        },

        dueDate: {
            type: Date,
            required: [true, "Please enter due date"],
        },

        submissionFile: {
            type: String,
            required: [false, "Please upload a file"],
        },

        module: {
            type: Schema.Types.ObjectId,
            ref: "Module",
        },

        submissions: [
            {
                submissionFile: {
                    type: String,
                    required: true,
                },
                submittedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Homework = mongoose.model("Homework", homeworkSchema);