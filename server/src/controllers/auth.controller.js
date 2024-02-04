import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";

const options = {
  httpOnly: true,
  secure: false,
};

export const checkAuth = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "user authorized"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      40,
      error?.message || "something went wrong while authorizing user"
    );
  }
});

export const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (
      [name, email, password].some((field) => !field || field.trim() === "")
    ) {
      throw new ApiError(400, "all fields required");
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
      throw new ApiError(409, "user already exists");
    }

    const createdUser = await User.create({
      name,
      email,
      password,
    });
    if (!createdUser) {
      throw new ApiError(500, "failed to create user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "user created successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      error?.message || "something went wrong while registering user"
    );
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim() || !password || !password.trim()) {
      throw new ApiError(400, "all fileds required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "user not found");
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
      throw new ApiError(400, "invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select("_id name email");

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedInUser, "user logged in successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      error?.message || "something went wrong while logging user"
    );
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "user logged out successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      400,
      error?.message || "something went wrong while logging out user"
    );
  }
});
