import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Classroom } from "../models/classroom.model";
import { User } from "../models/user.model";

const getClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.id;

    if (!classroomId) {
        throw new ApiError(400, "Classroom ID is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId).populate("classroomOwner_Name").populate("classroomMembers");
    
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
            classroomOwner_Name: req.user?._id,
            classroomOwnerId: req.user?._id,
            classroomMembers: [req.user?._id]
        });
    }catch(error){
        throw new ApiError(500, error.message || "An error occurred while creating the classroom");
    }
});

const deleteClassRoom = asyncHandler(async (req, res) => {
    const classroomId = req.params.id;

    if(!classroomId){
        throw new ApiError(400, "Classroom ID is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(classroom.classroomOwnerId.toString() !== req.user?._id.toString()){
            throw new ApiError(403, "You are not authorized to delete this classroom");
        }

        await classroom.remove();

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
    const classroomId = req.params.id;
    const {classroomName, classroomDesc} = req.body;

    if(!classroomName || !classroomDesc){
        throw new ApiError(400, "All fields are required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(classroom.classroomOwnerId.toString() !== req.user?._id.toString()){
            throw new ApiError(403, "You are not authorized to update this classroom");
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

    const classroomId = req.params.id;
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
    
        if(classroom.classroomOwnerId.toString() !== req.user?._id.toString()){
            throw new ApiError(403, "You are not authorized to add members to this classroom");
        }
    
        if(classroom.classroomMembers.includes(user._id)){
            throw new ApiError(400, "User is already a member of this classroom");
        }
    
        
        classroom.classroomMembers.push(user._id);
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
    const classroomId = req.params.id;
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

        if(classroom.classroomOwnerId.toString() !== req.user?._id.toString()){
            throw new ApiError(403, "You are not authorized to make members owner of this classroom");
        }

        if(!classroom.classroomMembers.includes(user._id)){
            throw new ApiError(400, "User is not a member of this classroom");
        }

        classroom.classroomOwnerId.push(user._id);
        classroom.classroomOwner_Name.push(user.username);
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
    const classroomId = req.params.id;
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

        if(classroom.classroomOwnerId.toString() !== req.user?._id.toString()){
            throw new ApiError(403, "You are not authorized to remove members from this classroom");
        }

        if(!classroom.classroomMembers.includes(user._id)){
            throw new ApiError(400, "User is not a member of this classroom");
        }

        classroom.classroomMembers = classroom.classroomMembers.filter(member => member.toString() !== user._id.toString());

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
    const classroomId = req.params.id;

    try {
        const classroom = await Classroom.findById(classroomId);
        const user = await User.findById(req.user?._id);

        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if (!classroom.classroomMembers.includes(user._id)) {
            throw new ApiError(400, "You are not a member of this classroom");
        }

        classroom.classroomMembers = classroom.classroomMembers.filter(member => member.toString() !== user._id.toString());
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

        if (classroom.classroomMembers.includes(user._id)) {
            throw new ApiError(400, "You are already a member of this classroom");
        }

        classroom.classroomMembers.push(user._id);
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