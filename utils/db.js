const mongoose=require("mongoose");

const connectDB = async () => {
    try {
        // Reverting to the standard connection logic
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connection successful to DB");
    } catch (error) {
        console.error("❌ Database connection failed!");
        console.error("Error details:", error.message);
        process.exit(1); // Exit with an error code
    }
};
module.exports=connectDB;