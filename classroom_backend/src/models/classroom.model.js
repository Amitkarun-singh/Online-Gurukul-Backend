import mongoose,{Schema} from "mongoose";

const classroomSchema = new Schema(
    {
        classroomName: {
            type: String,
            required: true,
            unique: true
        },
        classroomDesc: {
            type: String,
            required: true
        },
        classroomCode: {
            type: String,
            required: true,
            unique: true
        },
        classroomOwner_Name: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        classroomOwnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
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

const Classroom = mongoose.model("Classroom", classroomSchema);