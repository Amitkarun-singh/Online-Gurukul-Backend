import mongoose,{Schema} from "mongoose";

const classroomSchema = new Schema(
    {
        classroomName: {
            type: String,
            required: [true, "Please enter classroom name"],
            unique: true,
            trim: true
        },
        classroomDesc: {
            type: String,
            required: [true, "Please enter classroom Description"],
        },
        classroomCode: {
            type: String,
            required: [true, "Please enter classroom code"],
            unique: true
        },
        classroomOwnerId: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        classroomMembers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

    },
    {
        timestamps: true
    }
);

export const Classroom = mongoose.model("Classroom", classroomSchema);