import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId)=>{
    try {
       const user = await User.findById(userId)
       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave : false});

       return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Error generating tokens")
    }
}




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
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {username,email,password} = req.body;
    if(!(username || email)){
        throw new ApiError(400,"Username or email is required");
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })
    if(!user){
        throw new ApiError(401,"Invalid credentials")
    }
    const isPasswordvalid = await user.isPasswordCorrect(password);
    if(!isPasswordvalid){
        throw new ApiError(401,"password is incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )

})


const logoutUser = AsyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken : undefined}
        },
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})



export{ 
    registerUser,
    loginUser,
    logoutUser,
 }
