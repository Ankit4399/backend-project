import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectdb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`); // db connection return a object with connection property.
         console.log(`db connected: ${connectionInstance.connection.host}`);
         
    } catch (error) {
        console.log("mongoose connection failed",error);
        process.exit(1) //terminate the process 
    }
};

export default connectdb;