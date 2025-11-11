import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from req.body
  // validation - not empty, email format, password strength
  // check if username or email already exists
  // avatar is required, coverImage is optional
  // upload avatar and coverImage (if provided) to cloudinary
  // create user in database
  // remove password and refreshToken and other sensitive info from response
  // return success response
  const { fullName, username, email, password } = req.body;

  if (
    [fullName, username, email, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // additional validation can be added here
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatarUploadResponse = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUploadResponse = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatarUploadResponse) {
    throw new ApiError(500, "Avatar upload failed");
  }
  // avoid shadowing imported `User` by using a different variable name
  const newUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarUploadResponse.url,
    coverImage: coverImageUploadResponse?.url || null,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken -__v"
  );
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get email and password from req.body
  // validation - not empty
  // check if user exists
  // compare password
  // generate access and refresh tokens
  // return success response with tokens

  const { email, username, password } = req.body;
  if (!password || (!email && !username)) {
    throw new ApiError(400, "Email or username and password are required");
  }
  const user = await User.findOne(
    email ? { email } : { username: username.toLowerCase() }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordMatch(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -__v"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // get user id from req.user
  // clear refresh token in database
  // clear cookies
  // return success response
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user || user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Tokens refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid or expired refresh token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get user id from req.user
  const userId = req.user._id;

  // get oldPassword and newPassword from req.body
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isOldPasswordValid = await user.isPasswordMatch(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select(
    "-password -refreshToken -__v"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const {fullName, email} = req.body;
  const userId = req.user._id;

  if (!fullName && !email) {
    throw new ApiError(400, "At least one field (fullName or email) is required to update");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { fullName, email : email } },
    { new: true}
  ).select("-password -refreshToken -__v");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));  
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatarUploadResponse = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUploadResponse.url) {
    throw new ApiError(500, "Avatar upload failed");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar: avatarUploadResponse.url } },
    { new: true }
  ).select("-password -refreshToken -__v");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const coverImageUploadResponse = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImageUploadResponse.url) {
    throw new ApiError(500, "Cover image upload failed");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { coverImage: coverImageUploadResponse.url } },
    { new: true }
  ).select("-password -refreshToken -__v");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if(!username.trim()){
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },
    { $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    { $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    { $project: { fullName: 1, email: 1, avatar: 1, coverImage: 1, subscribersCount: 1, subscribedToCount: 1, isSubscribed: 1 } }
  ]);

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile };
