import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = AsyncHandler ( async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // check for user creation
    // remove password and refresh token field from response
    // return res

    const {fullname,username,email,password} = req.body

    // if(fullname === "" || username === "" || email === "" || password === ""){
    //     throw new ApiError(400,"All fields are required")
    // }
    if(
        [fullname,username,email,password].some((field)=>field?.trim() === "")  // some() returns true if any of the field is empty
    ){
        throw new ApiError(400,"All fields are required")
    }


    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"user already exists")
    }


    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverimageLocalPath = req.files?.coverimage[0]?.path;

    let coverimageLocalPath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverimageLocalPath = req.files.coverimage[0].path;
    }

    if (!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")    
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverimageLocalPath);
    if(!avatar){
        throw new ApiError(500,"Error uploading avatar")
    }

   const user =  await User.create({
        fullname,email,password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase(),
    })

   const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
       throw new ApiError(500,"Error creating user")
   }

   return res.status(201).json(
    new ApiResponse(201,createdUser,"User registered successfully")
   )


})

const loginUser = AsyncHandler(async (req,res)=>{

})
export { registerUser }
