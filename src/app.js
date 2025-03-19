import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"; // cross origin resource sharing  
const app = express();

// whenever we integrate middlewares in express, we use app.use() method

app.use(cors({
    origin : process.env.CORS_ORIGIN ,
    credentials: true
}));
 
app.use(express.json({limit: "20kb"}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static("public"));




export {app};