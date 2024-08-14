import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Homework } from "../models/homework.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const addHomework = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    const { title, description, dueDate } = req.body;

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    console.log(req.body);
    
    if(!title || !description || !dueDate){
        throw new ApiError(400, "Title, Homework Description, and Due Date are required");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }

        console.log(req.file);
        
        const homeworkFileLocalPath = req.file?.path;
        if(!homeworkFileLocalPath){
            throw new ApiError(400, "Homework file is required");
        }

        const homeworkFile = await uploadOnCloudinary(homeworkFileLocalPath);
        if(!homeworkFile){
            throw new ApiError(500, "An error occurred while uploading homework file");
        }

        const homework = new Homework({
            title: title,
            homeworkFile: homeworkFile.secure_url,
            description: description,
            dueDate: dueDate,
            module: moduleId
        });
        await homework.save();
        module.homework.push(homework._id);
        await module.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                homework,
                "Homework added successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding homework")
    }
});

const getHomeworks = asyncHandler(async(req, res) => {
    const { moduleId } = req.params;
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }

        const homeworks = await Homework.find({module:moduleId});
        if(!homeworks){
            throw new ApiError(404, "No homeworks found");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                homeworks,
                "Homeworks fetched successfully"
            )
        );
    }catch(error){
        throw new ApiError(500, error.message || "An error occurred while getting homeworks")
    }
});

const updateHomework = asyncHandler(async(req, res) => {
    const { moduleId, homeworkId } = req.params;
    const { title, description, dueDate } = req.body;

    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    if(!homeworkId){
        throw new ApiError(400, "Homework Id is required");
    }
    console.log(req.body);
    
    if(!title){
        throw new ApiError(400, "Title is required");
    }

    if(!description){
        throw new ApiError(400, "Homework Description is required");
    }

    if(!dueDate){
        throw new ApiError(400, "Due Date is required");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }

        const homework = await Homework.findById(homeworkId);
        if(!homework){
            throw new ApiError(404, "Homework not found");
        }

        if(homework.module.toString() !== moduleId){
            throw new ApiError(400, "Homework does not belong to the specified module");
        }
        const homeworkFile = req.file;
        if(homeworkFile){
            const homeworkFileLocalPath = req.file?.path;
            if(!homeworkFileLocalPath){
                throw new ApiError(400, "Homework file is required");
            }

            const homeworkFile = await uploadOnCloudinary(homeworkFileLocalPath);
            if(!homeworkFile){
                throw new ApiError(500, "An error occurred while uploading homework file");
            }

            await deleteFromCloudinary(homework.homeworkFile);
            homework.homeworkFile = homeworkFile.secure_url;
        }

        homework.title = title;
        homework.description = description;
        homework.dueDate = dueDate;

        await homework.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                homework,
                "Homework updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating homework")
    }
});

const deleteHomework = asyncHandler(async(req, res) => {
    const { homeworkId, moduleId } = req.params;
    if(!homeworkId){
        throw new ApiError(400, "Homework Id is required");
    }
    if(!moduleId){
        throw new ApiError(400, "Module Id is required");
    }

    try {
        const module = await Module.findById(moduleId);
        if(!module){
            throw new ApiError(404, "Module not found");
        }
        const homework = await Homework.findById(homeworkId);
        if(!homework){
            throw new ApiError(404, "Homework not found");
        }

        await deleteFromCloudinary(homework.homeworkFile);
        await homework.deleteOne({ _id: homeworkId });
        module.homework.pull(homeworkId);
        await module.save();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Homework deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting homework")
    }
});

const homeworkSubmission = asyncHandler(async (req, res) => {
    const { homeworkId } = req.params;
    const submissionFileLocalPath = req.file?.path;

    if (!submissionFileLocalPath) {
        throw new ApiError(400, "Submission file is required");
    }

    if (!homeworkId) {
        throw new ApiError(400, "Homework Id is required");
    }

    try {
        const homework = await Homework.findById(homeworkId);
        if (!homework) {
            throw new ApiError(404, "Homework not found");
        }

        const submissionFile = await uploadOnCloudinary(submissionFileLocalPath);
        if (!submissionFile) {
            throw new ApiError(500, "An error occurred while uploading submission file");
        }

        homework.submissions.push({
            submissionFile: submissionFile.secure_url,
        });
        await homework.save();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    homework,
                    "Homework submitted successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while submitting homework");
    }
});

export { 
    addHomework, 
    getHomeworks,
    updateHomework, 
    deleteHomework, 
    homeworkSubmission
};