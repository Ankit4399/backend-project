import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})

// The above code snippet is a middleware that uses multer to store the uploaded file in the public/temp directory.
// cb is a callback function that takes two arguments, the first one is an error object and the second one is the path where the file is stored.
