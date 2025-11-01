import { ApiError } from "../utils/ApiError";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
 
     if (!token) {
         throw new ApiError(401, "Access token is missing");
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
     const user = await User.findById(decodedToken?._id).select(
       "-password -refreshToken -__v"
     );
     if (!user) {
         throw new ApiError(401, "Invalid access token");
     }
     req.user = user;
     next();
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid or expired access token");
   }
});