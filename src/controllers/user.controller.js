import { AsyncHandler } from "../utils/AsyncHandler.js";

const registerUser = AsyncHandler ( (req,res)=>{
    res.status(200).json({
        message : 'ok'
    })
})

export { registerUser }
