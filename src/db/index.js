import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectdb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`); // db connection return a object with connection property.
         console.log(`db connected: ${connectionInstance.connection.host}`);
         
    } catch (error) {
        console.log("mongoose connection failed",error);
        process.exit(1) //intentially terminate the process 
    }
};

export default connectdb;



/*
 1. When connecting to databases, handling potential data-not-found scenarios is essential. Employ try/catch blocks or promises to manage errors or we can also use promises.

        - key to remember : ( wrap in try-catch )

    2. Database operations involve latency, and traditional synchronous code can lead to blocking, where the program waits for the database query to complete before moving on. So, we should async/await which allows for non-blocking execution, enabling the program to continue with other tasks while waiting for the database response. 

        - key to remember :  ( always remember the database is in another continent, so use async await)

    3. env file mei change karte hi, server ko restart karna hi padega, no other option, nodemon env files ka track nahi rakhta.

- Used two approach to connect the database - 1. In Index File, 2. In Seprate DB file

- Assignments - 
    - console log `connectionInstance`
    - Read more about process.exit code
        process.exit(0) =>  indicate exit successfully without any interption.
        process.exit(1)=> intentially terminate the process.
*/