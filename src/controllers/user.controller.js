import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user data from req.body
  // validation - not empty, email format, password strength
  // check if username or email already exists
  // check if avatar and coverImage are provided
  // upload avatar and coverImage to cloudinary
  // create user in database
  // remove password and refreshToken and other sensitive info from response
  // return success response
  const { fullName, username, email, password } = req.body;
  console.log(email);
  console.log(req.body);

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
    throw new ApiError(400, "Avatar and cover image are required");
  }

    const avatarUploadResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUploadResponse = coverImageLocalPath
      ? await uploadOnCloudinary(coverImageLocalPath)
      : null;

    if (!avatarUploadResponse) {
        throw new ApiError(500, "Avatar upload failed");
    }
    const User = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatarUploadResponse.url,
        coverImage: coverImageUploadResponse?.url || null,
    });

    const createdUser = await User.findById(User._id).select("-password -refreshToken -__v");
    if(!createdUser){
        throw new ApiError(500, "User creation failed");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));

});

export { registerUser };
