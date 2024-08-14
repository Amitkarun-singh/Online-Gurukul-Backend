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
        classroomMembersID: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        ModuleID: [
            {
                type: Schema.Types.ObjectId,
                ref: "Module"
            }
        ],
        meetLink : {
            type: Schema.Types.ObjectId,
            ref: "Meet",
        }
    },
    {
        timestamps: true
    }
);

export const Classroom = mongoose.model("Classroom", classroomSchema);