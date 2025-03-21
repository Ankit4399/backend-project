const AsyncHandler = (requestHandler)=> {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}



export {AsyncHandler};





// const AsyncHandler = ()=>{ async ()=>{}}
// const AsyncHandler = ()=> async ()=>{}

// const AsyncHandler = (fn)=> async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (err) {
//         res.status(err.code || 500).json({
//             success : false,
//             message : err.message
//         })
//     }
// }