// require("dotenv").config({path : '/.env'});

import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // load the environment variables from the .env file
                                // also add -r dotenv/config --experimental-json-modules to the nodemon command in package.json
import connectdb from "./db/index.js";

connectdb();
















/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

import express from "express";
const app = express();
;(async ()=>{
    try {
       await  mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`); // connect to the database
        app.on("error", (error) => {                          // listen for errors
            console.log(`Express error: ${error.message}`); 
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);   
        });
    } catch (error) {
        console.log(`db connection failed: ${error.message}`);
        throw error;
    }
})();
*/

// The code above is a simple example of how to connect to a MongoDB database using Mongoose.


// nodemon is used to restart the server when changes are made
//npm i -D nodemon
//npm run dev
//dev script is added to package.json
