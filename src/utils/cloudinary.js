import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // Node.js file system module to do file operations

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key :process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{resource_type : "auto"});
        // console.log("succesfully uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file after the successful upload on cloudinary
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary };