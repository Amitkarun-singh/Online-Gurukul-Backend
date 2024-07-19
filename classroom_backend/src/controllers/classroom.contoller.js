import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Classroom } from "../models/classroom.model.js";
import { User } from "../models/user.model.js";

const getClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;
    console.log(req.params);

    if (!classroomId) {
        throw new ApiError(400, "Classroom ID is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId).populate("classroomMembersID");
    
        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "Classroom fetched Successfully"
        ))
    
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while retrieving the classroom");
    }

});

const createClassRoom = asyncHandler(async (req, res) => {
    const {classroomName, classroomDesc, classroomCode} = req.body;

    if([classroomCode, classroomDesc, classroomName].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All the fields are required")
    }

    try {
        const classroom = await Classroom.create({
            classroomName,
            classroomDesc,
            classroomCode,
            classroomOwnerId: [req.user?._id],
            classroomMembersID: [req.user?._id]
        });

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            classroom,
            "Classroom created successfully"
        ))
    }catch(error){
        throw new ApiError(500, error.message || "An error occurred while creating the classroom");
    }
});

const deleteClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;

    if(!classroomId){
        throw new ApiError(400, "Classroom ID is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }

        await Classroom.deleteOne({ _id: classroomId });

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Classroom deleted successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting the classroom");
    }
});

const updateClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;
    const {classroomName, classroomDesc} = req.body;

    if(!classroomName || !classroomDesc){
        throw new ApiError(400, "All fields are required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }

        classroom.classroomName = classroomName;
        classroom.classroomDesc = classroomDesc;

        await classroom.save();

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "Classroom updated successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the classroom");
    }
});

const addClassRoomMember = asyncHandler(async (req, res) => {

    const classroomId = req.params.classroomId;
    const {email} = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        const user = await User.findOne({email: email});
        
        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }
    
        if(!user){
            throw new ApiError(404, "User not found");
        }
    
        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }
    
        if(classroom.classroomMembersID.includes(user._id)){
            throw new ApiError(400, "User is already a member of this classroom");
        }
    
        
        classroom.classroomMembersID.push(user._id);
        await classroom.save();
    
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "User added to classroom successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding user to the classroom");
    }
});

const makeClassRoomOwner = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;
    const {email} = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        const user = await User.findOne({email: email});

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }

        if(!classroom.classroomMembersID.includes(user._id)){
            throw new ApiError(400, "User is not a member of this classroom");
        }

        classroom.classroomOwnerId.push(user._id);
        await classroom.save();

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "User added as owner successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while making user owner of the classroom");
    }
});

const removeClassRoomMember = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;
    const {email} = req.body;

    try {
        const classroom = await Classroom.findById(classroomId);
        const user = await User.findOne({email: email});

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }

        if(!classroom.classroomMembersID.includes(user._id)){
            throw new ApiError(400, "User is not a member of this classroom");
        }

        classroom.classroomMembersID = classroom.classroomMembersID.filter(member => member.toString() !== user._id.toString());

        await classroom.save();

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "User removed from classroom successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while removing user from the classroom");
    }
});

const leaveClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.classroomId;

    try {
        const classroom = await Classroom.findById(classroomId);
        const user = await User.findById(req.user?._id);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if (!classroom.classroomMembersID.includes(user._id)) {
            throw new ApiError(400, "You are not a member of this classroom");
        }

        classroom.classroomMembersID = classroom.classroomMembersID.filter(member => member.toString() !== user._id.toString());
        await classroom.save();

        user.classroom = user.classroom.filter(room => room.toString() !== classroom._id.toString());
        await user.save();

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                classroom,
                "User left the classroom successfully"
            ));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while leaving the classroom");
    }
});

const joinClassRoom = asyncHandler(async (req, res) => {
    const {classroomCode} = req.body;

    if (!classroomCode) {
        throw new ApiError(400, "Classroom code is required");
    }

    try {
        const classroom = await Classroom.findOne({classroomCode: classroomCode});
        const user = await User.findById(req.user?._id);

        if (!classroom) {
            throw new ApiError(404, "Classroom not found");
        }

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if (classroom.classroomMembersID.includes(user._id)) {
            throw new ApiError(400, "You are already a member of this classroom");
        }

        classroom.classroomMembersID.push(user._id);
        await classroom.save();
        user.classroom.push(classroom._id);
        await user.save();

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroom,
            "User joined the classroom successfully"
        ))
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while joining the classroom");
    }
});

export {
    getClassRoom,
    createClassRoom,
    deleteClassRoom,
    updateClassRoom,
    addClassRoomMember,
    makeClassRoomOwner,
    removeClassRoomMember,
    leaveClassRoom,
    joinClassRoom
}