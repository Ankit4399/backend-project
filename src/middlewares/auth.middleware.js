import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

//when res is not used ,we can use _ instead of res
export const verifyJWT = AsyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiError(401,"authorization token not found")
        }
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401,"User not found")
        }
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401,"Invalid Aurthorization");
    }
})

//get accessToken from cookies
//verify token with process.env.ACCESS_TOKEN_SECRET
//find user with id in token
//insert user in req object
//call next middleware