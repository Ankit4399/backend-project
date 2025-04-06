import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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

    if(!username && !email){
        throw new ApiError(400,"Username or email is required");
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    });

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
            $unset : {refreshToken : 1}
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


const refreshAccessToken = AsyncHandler(async (req,res)=>{
    //get user's refresh token from cookies or body(mobile)
    //verify the token with process.env.REFRESH_TOKEN_SECRET
    //now we get the decoded token with user id
    //find the user with id in token
    // check if incoming refresh token is same as the one in db
    //generate new access and refresh token
    //send cookies with new tokens

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token not found")
    }
    try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"User not found")
    }
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Invalid refresh token")
    }
    const options = {
        httpOnly : true,
        secure : true
    }
    const {accessToken,refreshToken : newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json( new ApiResponse(
        200,
        {
            accessToken,
            refreshToken : newRefreshToken
        },
        "New access token generated"
    ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword  = AsyncHandler( async (req,res)=>{
    const {oldPassword,newPassword} = req.body
    
    const user = await User.findById(req.user?._id)
    const passwordCheck = await user.isPasswordCorrect(oldPassword)
    if(!passwordCheck){
        throw new ApiError(401,"Invalid password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = AsyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        ApiResponse(
            200,
            req.user,
            "current user fetch successfully"
        )
    )
})

const updateAccountDetails = AsyncHandler(async(req,res)=>{
    const {fullname,email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email,
            }
        },
        {
            new : true,
        },
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )
})

const updateUserAvatar = AsyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // Get existing user with current avatar URL
    const user = await User.findById(req.user._id)
    if(!user) {
        throw new ApiError(404, "User not found")
    }

    // Get public ID from existing avatar URL
    const existingAvatarUrl = user.avatar
    const publicId = existingAvatarUrl?.split('/').pop().split('.')[0]

    // Delete existing avatar if it exists
    if(publicId) {
        await deleteOnCloudinary(publicId)
    }

    // Upload new avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, "Error uploading avatar on cloudinary")
    }

    // Update user with new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "Avatar updated successfully"
        )
    )
})

const updateUsercoverImage = AsyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is required")
    }

    // Get existing user with current cover image URL
    const user = await User.findById(req.user._id)
    if(!user) {
        throw new ApiError(404, "User not found")
    }

    // Get public ID from existing cover image URL
    const existingCoverImageUrl = user.coverImage
    const publicId = existingCoverImageUrl?.split('/').pop().split('.')[0]

    // Delete existing cover image if it exists
    if(publicId) {
        await deleteOnCloudinary(publicId)
    }

    // Upload new cover image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500,"Error uploading cover image on cloudinary")
    }

    // Update user with new cover image URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "Cover image updated successfully"
        )
    )
})

const getUserChannelProfile = AsyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username){
        throw new ApiError(400,"Username is required")
    }
    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        { //finding subscribers
            $lookup : { 
                from : "subscriptions",      // write in form of how model store in db(plural form)
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        { // finding channels user subscribed to
            $lookup : {
                from : "subscriptions", 
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            } 
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in :[req.user?._id,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                username : 1,
                fullname : 1,
                email : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"Channel profile fetched successfully"))

})

const getWatchHistory = AsyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                    $lookup : {
                        from : "users",
                        localField : "owner",
                        foreignField : "_id",
                        as : "owner",
                        pipeline:[{
                                $project : {
                                    fullname : 1,
                                    avatar : 1,
                                    username : 1,
                                }    
                        }]
                    }
                },
                {
                    $addFields : {
                        owner : {
                            $first : "$owner"
                        }
                    }
                },
            ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0]?.watchHistory,"Watch history fetched successfully"))
})


export{ 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile,
    getWatchHistory, 
 }
