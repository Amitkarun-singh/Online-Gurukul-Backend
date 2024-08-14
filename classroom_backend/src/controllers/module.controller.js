import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Classroom } from "../models/classroom.model.js";

const createModule = asyncHandler(async(req, res)=> {

    const { moduleName } = req.body;
    const { classroomId } = req.params;

    if(!classroomId){
        throw new ApiError(400, "Classroom Id is required")
    }

    try {
        const classroom = await Classroom.findById(classroomId);

        if(!classroom){
            throw new ApiError(400, "Classroom not found")
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to create module in this classroom");
        }

        const module = new Module({
            moduleName: moduleName
        });

        await module.save();
        await classroom.ModuleID.push(module._id);
        await classroom.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                module,
                "Module created successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while creating the module")
    }
});

const getModule = asyncHandler(async(req, res)=> {

    const { classroomId } = req.params;
    const moduleId = req.params.moduleId;

    if(!classroomId) {
        throw new ApiError(400, "Classroom Id is required");
    }

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);
        if(!classroom){
            throw new ApiError(400, "Classroom not found");
        }

        if (!classroom.classroomOwnerId.includes(req.user._id.toString()) && !classroom.classroomMemberIds.includes(req.user._id.toString())) {
            throw new ApiError(403, "You are not a member of this classroom");
        }

        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(400, "Module not found");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                module,
                "Module fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching the module")
    }
});

const getAllModules = asyncHandler(async(req, res)=> {
    const { classroomId } = req.params;

    if(!classroomId){
        throw new ApiError(400, "Classroom Id is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);
        if(!classroom){
            throw new ApiError(400, "Classroom not found");
        }

        if (!classroom.classroomOwnerId.includes(req.user._id.toString()) && !classroom.classroomMemberIds.includes(req.user._id.toString())) {
            throw new ApiError(403, "You are not a member of this classroom");
        }

        const modules = await Module.find({ _id: { $in: classroom.ModuleID } });

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                modules,
                "Modules fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching the modules");
    }
});

const updateModule = asyncHandler(async(req, res)=> {
    
    const { classroomId } = req.params;

    if(!classroomId){
        throw new ApiError(400, "Classroom Id is required");
    }

    const moduleId = req.params.moduleId;

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    try {
        const classroom = await Classroom.findById(classroomId);
        if(!classroom){
            throw new ApiError(400, "Classroom not found");
        }

        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(400, "Module not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to update module in this classroom");
        }

        const { moduleName } = req.body;
        if(!moduleName){
            throw new ApiError(400, "Module name is required");
        }

        module.moduleName = moduleName;
        await module.save();
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                module,
                "Module updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the module");
    }
});

const deleteModule = asyncHandler(async(req, res)=> {
    const { classroomId } = req.params;
    const moduleId = req.params.moduleId;

    if(!classroomId){
        throw new ApiError(400, "Classroom Id is required");
    }

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }
    try {
        const classroom = await Classroom.findById(classroomId);
        if(!classroom){
            throw new ApiError(400, "Classroom not found");
        }

        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(400, "Module not found");
        }

        if(!classroom.classroomOwnerId.includes(req.user._id.toString())){
            throw new ApiError(403, "You are not authorized to delete module in this classroom");
        }

        await Module.deleteOne({_id:moduleId});
        await classroom.ModuleID.pull(moduleId);
        await classroom.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Module deleted successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting the module");
    }
});


export{
    createModule,
    getModule,
    getAllModules,
    updateModule,
    deleteModule,
}