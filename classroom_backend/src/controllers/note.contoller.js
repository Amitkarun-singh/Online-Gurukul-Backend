import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Note } from "../models/note.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const addNote = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    const { notesFile } = req.body;

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    if(!notesFile){
        throw new ApiError(400, "Please upload a file");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }

        const noteFileLocalPath = req.files.notesFile[0]?.path;
        if(!noteFileLocalPath){
            throw new ApiError(400, "Note file is required");
        }

        const noteFile = await uploadOnCloudinary(noteFileLocalPath);
        if(!noteFile){
            throw new ApiError(500, "An error occurred while uploading note file");
        }

        const note = new Note({
            notesFile: noteFile.secure_url,
            module: moduleId
        });
        await note.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                note,
                "Note added successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding notefile")
    }
});

const getNotes = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }

        const notes = await Note.find({module:moduleId});
        if(!notes){
            throw new ApiError(404, "No notes found");
        }
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                notes,
                "Notes fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching notes")
    }
});

const deleteNote = asyncHandler(async(req, res) => {
    const { noteId } = req.params;
    if(!noteId){
        throw new ApiError(400, "Note Id is required");
    }

    try {
        const note = await Note.findById(noteId);
        if(!note){
            throw new ApiError(404, "Note not found");
        }

        const noteFilePublicId = note.notesFile.split("/").pop().split(".")[0];
        const deleteResult = await deleteFromCloudinary(noteFilePublicId);
        if(deleteResult.result !== "ok"){
            throw new ApiError(500, "An error occurred while deleting note file");
        }

        await note.remove();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Note deleted successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting note")
    }
});

export{
    addNote,
    getNotes,
    deleteNote
}