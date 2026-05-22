const mongoose=require("mongoose");
//const URI = "mongodb://127.0.0.1:27017/mern_admin";
// mongoose.connect(URI);
const URI=process.env.MONGODB_URI;
const connectDB=async()=>{
    try{
      await mongoose.connect(URI);
      console.log("connection successful to DB");
    } catch(error){
      console.error("Database connection failed");
      console.log(error);
      process.exit(1);
    }
};
module.exports=connectDB;