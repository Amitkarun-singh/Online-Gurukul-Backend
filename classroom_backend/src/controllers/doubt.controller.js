import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Module } from "../models/module.model.js";
import { Video } from "../models/video.model.js";
import { Lecture } from "../models/lecture.model.js"
import { Doubt } from "../models/doubt.model.js";
import { User } from "../models/user.model.js";

const addDoubt = asyncHandler(async(req, res) => {
    const { lectureId, videoId } = req.params
    const { doubtDescription } = req.body
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required")
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required")
    }
    if(!doubtDescription){
        throw new ApiError(400, "Doubt Description is required")
    }
    try {
        const lecture = await Lecture.findById(lectureId)
        if(!lecture){
            throw new ApiError(404, "Lecture not found")
        }
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404, "Video not found")
        }
        const doubt = new Doubt({
            doubtDescription: doubtDescription,
            lecture: lectureId,
            video: videoId,
            student: req.user._id
        })
        lecture.doubt.push(doubt._id);
        await lecture.save();
        await doubt.save()
        video.doubt.push(doubt._id);
        await video.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubt,
                "Doubt added successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding doubt");
    }
});

const getDoubts = asyncHandler(async(req, res) => {
    const { lectureId, videoId } = req.params
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required")
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required")
    }
    try {
        const lecture = await Lecture.findById(lectureId)
        if(!lecture){
            throw new ApiError(404, "Lecture not found")
        }
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404, "Video not found")
        }
        const doubts = await Doubt.find({lecture: lectureId, video: videoId})
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubts,
                "Doubts found successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching doubts");
    }
});

const getAllDoubts = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }
    try {
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
        const doubts = await Doubt.find({ video: videoId });
        const formattedDoubts = await Promise.all(doubts.map(async (doubt) => {
            const student = await User.findById(doubt.student);
            const formattedReplies = await Promise.all(doubt.replies.map(async (reply) => {
            const replier = await User.findById(reply.replier);
            return {
                replyDescription: reply.replyDescription,
                replierName: replier.fullName,
                replierAvatar: replier.avatar,
                createdAt: reply.createdAt
            };
            }));
            return {
            id: doubt._id,
            doubtDescription: doubt.doubtDescription,
            studentName: student.fullName,
            studentAvatar: student.avatar,
            replies: formattedReplies,
            createdAt: doubt.createdAt
            };
        }));

        return res
            .status(200)
            .json(
            new ApiResponse(
                200,
                formattedDoubts,
                "Doubts found successfully"
            )
            );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while fetching doubts");
    }
});

const updateDoubts = asyncHandler(async(req, res) => {
    const { lectureId, videoId, doubtId } = req.params;
    const { doubtDescription } = req.body;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    if(!videoId){
        throw new ApiError(400, "Video Id is required");
    }
    if(!doubtId){
        throw new ApiError(400, "Doubt Id is required");
    }
    if(!doubtDescription){
        throw new ApiError(400, "Doubt Description is required");
    }
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(404, "Video not found");
        }
        const doubt = await Doubt.findById(doubtId);
        if(!doubt){
            throw new ApiError(404, "Doubt not found");
        }
        doubt.doubtDescription = doubtDescription;
        await doubt.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doubt,
                "Doubt updated successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while updating the doubt");
    }
});

const deleteDoubts = asyncHandler(async(req, res) => {
    const { lectureId, doubtId } = req.params;
    if(!lectureId){
        throw new ApiError(400, "Lecture Id is required");
    }
    if(!doubtId){
        throw new ApiError(400, "Doubt Id is required");
    }
    try {
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            throw new ApiError(404, "Lecture not found");
        }
        const doubt = await Doubt.findById(doubtId);
        if(!doubt){
            throw new ApiError(404, "Doubt not found");
        }
        await doubt.deleteOne({_id: doubtId});
        lecture.doubt.pull(doubtId);
        await lecture.save();
        Video.doubt.pull(doubtId);
        await video.save();
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Doubt deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while deleting the doubt");
    }
});

const addDoubtReply = asyncHandler(async (req, res) => {
    const { doubtId } = req.params;
    const { replyDescription } = req.body;
    if (!doubtId) {
        throw new ApiError(400, "Doubt Id is required");
    }
    if (!replyDescription) {
        throw new ApiError(400, "Reply Description is required");
    }
    try {
        const doubt = await Doubt.findById(doubtId);
        if (!doubt) {
            throw new ApiError(404, "Doubt not found");
        }
        const reply = {
            replyDescription: replyDescription,
            replier: req.user._id,
            createdAt: new Date()
        };
        doubt.replies.push(reply);
        await doubt.save();
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    reply,
                    "Reply added successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message || "An error occurred while adding the reply");
    }
});


export {
    addDoubt,
    getDoubts,
    getAllDoubts,
    updateDoubts,
    deleteDoubts,
    addDoubtReply
}