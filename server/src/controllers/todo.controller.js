import mongoose, { isValidObjectId } from "mongoose";
import { Todo } from "../models/todo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addTodo = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { title, description, priority, startDate, endDate } = req.body;
    if (!title || !title.trim() || !description || !description.trim()) {
      throw new ApiError(400, "all fields required");
    }

    const existingTodo = await Todo.findOne({
      owner: new mongoose.Types.ObjectId(userId),
      title,
    });
    if (existingTodo) {
      throw new ApiError(409, "todo already existed");
    }

    const createdTodo = await Todo.create({
      owner: userId,
      title,
      description,
      priority,
      startDate,
      endDate,
    });
    if (!createdTodo) {
      throw new ApiError(400, "failed to create todo");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdTodo, "todo created successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      40,
      error?.message || "something went wrong while creating todo"
    );
  }
});

export const updateTodo = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { todoId } = req.params;
    const { title, description, priority, startDate, endDate, status } =
      req.body;
    if (!isValidObjectId(todoId)) {
      throw new ApiError(400, "invalid todo id");
    }
    if (!title || !title.trim() || !description || !description.trim()) {
      throw new ApiError(400, "all fields required");
    }

    const todo = await Todo.findById(todoId);
    if (todo?.owner.toString() !== userId?.toString()) {
      throw new ApiError(400, "unauthorized request");
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        $set: {
          title,
          description,
          priority,
          startDate,
          endDate,
          status,
        },
      },
      { new: true }
    );
    if (!updatedTodo) {
      throw new ApiError(400, "failed to update todo");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTodo, "todo updated successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      40,
      error?.message || "something went wrong while updating todo"
    );
  }
});

export const deleteTodo = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { todoId } = req.params;
    if (!isValidObjectId(todoId)) {
      throw new ApiError(400, "invalid todo id");
    }

    const todo = await Todo.findById(todoId);
    if (todo?.owner.toString() !== userId?.toString()) {
      throw new ApiError(400, "unauthorized request");
    }

    await Todo.findByIdAndDelete(todoId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "todo deleted successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      40,
      error?.message || "something went wrong while deleting todo"
    );
  }
});

export const getTodos = asyncHandler(async (req, res) => {
  // tab = "all", "upcoming", "ongoing", "overdue", "completed",
  // priority=["low","medium","high"]
  // order="newest","oldest","latest"
  try {
    const userId = req.user?._id;
    const { tab, priority, order } = req.query;
    console.log(priority);

    const pipeline = [];
    const currentDate = new Date();

    const matchStage = {};
    matchStage["owner"] = new mongoose.Types.ObjectId(userId);
    if (tab === "upcoming") {
      matchStage["startDate"] = { $gt: currentDate };
    } else if (tab === "ongoing") {
      matchStage["startDate"] = { $lte: currentDate };
      matchStage["endDate"] = { $gte: currentDate };
    } else if (tab === "overdue") {
      matchStage["endDate"] = { $lt: currentDate };
    } else if (tab === "completed") {
      matchStage["status"] = true;
    }

    if (priority && priority.length > 0) {
      matchStage["priority"] = { $in: JSON.parse(priority) };
    }
    pipeline.push({ $match: matchStage });

    const sortStage = {};
    if (order === "latest") {
      sortStage["startDate"] = 1;
    } else if (order === "oldest") {
      sortStage["updatedAt"] = -1;
    } else {
      sortStage["updatedAt"] = 1;
    }
    pipeline.push({ $sort: sortStage });

    const todos = await Todo.aggregate(pipeline);

    return res
      .status(200)
      .json(new ApiResponse(200, todos, "todos fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      40,
      error?.message || "something went wrong while fetching todos"
    );
  }
});
