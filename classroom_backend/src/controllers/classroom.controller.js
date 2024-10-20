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
        const classroom = await Classroom.findById(classroomId).populate("classroomMembersID").populate("classroomOwnerId", "fullName");
    
        if(!classroom){
            throw new ApiError(404, "Classroom not found");
        }

        const classOwnerName = classroom.classroomOwnerId.fullName;

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            { ...classroom.toObject(), classOwnerName },
            "Classroom fetched Successfully"
        ))
    
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while retrieving the classroom");
    }

});

const getAllClassRoomUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(400, "Logged in first");
    }

    try {
        const classrooms = await Classroom.find({ 
            $or: [
            { classroomMembersID: userId },
            { classroomOwnerId: userId }
            ]
        })

        if (!classrooms || classrooms.length === 0) {
            return res.status(404).json(new ApiError(404, "No classrooms found for this user"));
        }

        const classroomDetails = await Classroom.aggregate([
            {
                $match: {
                    _id: { $in: classrooms.map(classroom => classroom._id) }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "classroomOwnerId",
                    foreignField: "_id",
                    as: "classroomOwners"
                }
            },
            {
                $unwind: "$classroomOwners"
            },
            {
                $project: {
                    _id: 1,
                    classroomName: 1,
                    classroomDesc: 1,
                    classroomMembersID: 1,
                    classroomOwnerName: "$classroomOwners.fullName"
                }
            }
        ]);

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            classroomDetails,
            "Users fetched Successfully"
        ))

    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while retrieving the users");
    }
});

const createClassRoom = asyncHandler(async (req, res) => {
    const {classroomName, classroomDesc, classroomCode} = req.body;

    if (!classroomName || classroomName.trim() === "") {
        throw new ApiError(400, "Classroom name is required");
    }

    if (!classroomDesc || classroomDesc.trim() === "") {
        throw new ApiError(400, "Classroom description is required");
    }

    const wordCount = classroomDesc.trim().split(/\s+/).length;
    if (wordCount < 20) {
        throw new ApiError(400, "Classroom description must be at least 20 words");
    }

    if (!classroomCode || classroomCode.trim() === "") {
        throw new ApiError(400, "Classroom code is required");
    }

    if (classroomCode.length !== 7 || /\s/.test(classroomCode)) {
        throw new ApiError(400, "Classroom code must be exactly 7 characters long and contain no spaces");
    }

    try {
        const currentUser = req.user;
        if (!currentUser) {
            throw new ApiError(401, "User not authenticated");
        }

        const userRole = currentUser.role;
        if (userRole !== "teacher") {
            throw new ApiError(403, "You are not authorized to create a classroom");
        }

        const classroomNameExists = await Classroom.findOne({classroomName : classroomName});
        if (classroomNameExists) {
            throw new ApiError(400, "Classroom name already exists");
        }
        const classroomCodeExists = await Classroom.findOne({classroomCode : classroomCode});
        if (classroomCodeExists) {
            throw new ApiError(400, "Classroom code already exists");
        }

        const classroom = await Classroom.create({
            classroomName,
            classroomDesc,
            classroomCode,
            classroomOwnerId: [req.user?._id],
        });
        currentUser.classroomID.push(classroom._id);
        await currentUser.save();
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

        await User.updateMany(
            { classroom: classroomId },
            { $pull: { classroom: classroomId } }
        );
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
            throw new ApiError(403, "You are not authorized to add members from this classroom");
        }
    
        if(classroom.classroomMembersID.includes(user._id)){
            throw new ApiError(400, "User is already a member of this classroom");
        }
    
        user.classroomID.push(classroomId);
        await user.save();
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
        classroom.classroomMembersID.$pull(user._id);
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

        user.classroomID = user.classroomID.filter( classroomId => classroomId.toString() !== classroomId.toString());
        await user.save();
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

        if (!classroom.classroomMembersID.includes(user._id) && !classroom.classroomOwnerId.includes(user._id)) {
            throw new ApiError(400, "You are not a member or owner of this classroom");
        }

        classroom.classroomMembersID = classroom.classroomMembersID.filter(member => member.toString() !== user._id.toString());
        classroom.classroomOwnerId = classroom.classroomOwnerId.filter(member => member.toString() !== user._id.toString());
        await classroom.save();

        user.classroomID = user.classroomID.filter(room => room.toString() !== classroom._id.toString());
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

        if (classroom.classroomMembersID.includes(user._id) || classroom.classroomOwnerId.includes(user._id)) {
            throw new ApiError(400, "You are already a member of this classroom");
        }

        classroom.classroomMembersID.push(user._id);
        await classroom.save();
        user.classroomID.push(classroom._id);
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

const searchClassRooms = asyncHandler(async (req, res) => {
    const { searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }

    try {
        const classrooms = await Classroom.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "classroomOwnerId",
                    foreignField: "_id",
                    as: "classroomOwners"
                }
            },
            {
                $unwind: "$classroomOwners"
            },
            {
                $match: {
                    $or: [
                        { classroomName: { $regex: searchQuery, $options: "i" } }, 
                        { "classroomOwners.fullName": { $regex: searchQuery, $options: "i" } } 
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    classroomName: 1,
                    classroomDesc: 1,
                    classroomMembersID: 1,
                    classroomOwnerName: "$classroomOwners.fullName"
                }
            }
        ]);

        if (!classrooms || classrooms.length === 0) {
            return res.status(404).json(new ApiError(404, "No classrooms found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, classrooms, "Classrooms fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while searching classrooms");
    }
});


export {
    getClassRoom,
    getAllClassRoomUser,
    createClassRoom,
    deleteClassRoom,
    updateClassRoom,
    addClassRoomMember,
    makeClassRoomOwner,
    removeClassRoomMember,
    leaveClassRoom,
    joinClassRoom,
    searchClassRooms
}