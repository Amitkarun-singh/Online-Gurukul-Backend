import mongoose,{Schema} from "mongoose";

const classroomSchema = new Schema(
    {
        classroomName: {
            type: String,
            required: true,
            unique: true
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
        classroomOwner_Email: {
            type: Schema.Types.ObjectId,
            ref: "User"
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