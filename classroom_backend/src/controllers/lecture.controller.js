import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Video } from "../models/video.model.js";
import { Lecture } from "../models/lecture.model.js"

const createLecture = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    const { lecturename } = req.body;

    if(!lecturename){
        throw new ApiError(400, "Lecture name is required");
    }

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }
    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }
        const lecture = new Lecture({
            lecturename: lecturename,
            module: moduleId
        });
        await lecture.save();
        module.lecture.push(lecture._id);
        await module.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                lecture,
                "Lecture created successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while creating lecture");
    }
});

const getLecture = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    const { lectureId } = req.params;
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                lecture,
                "Lecture found successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while getting lecture");
    }
});

const getAllLectures = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }
    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }
        const lectures = await Lecture.find({ module: moduleId });
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                lectures,
                "Lectures retrieved successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while getting lectures");
    }
});

const deleteLecture = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    const { lectureId } = req.params;
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        await Video.deleteMany({ lecture: lectureId });
        module.lecture.pull(lecture._id);
        await lecture.deleteOne({ _id: lectureId });
        await module.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Lecture deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting lecture");
    }
});

export {
    createLecture,
    getLecture,
    getAllLectures,
    deleteLecture
}