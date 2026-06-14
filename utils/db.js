const mongoose=require("mongoose");

const connectDB = async () => {
    // Remove whitespace and potential surrounding quotes from the .env value
    const URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim().replace(/^["']|["']$/g, '') : null;

    if (!URI || URI === "your_mongodb_connection_uri") {
        console.error("❌ Database connection failed!");
        console.error("Error details: MONGODB_URI is missing or still contains the placeholder text in your .env file.");
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(URI);
        console.log(`✅ Connection successful to MongoDB Atlas. Active Database: "${conn.connection.name}"`);
        
        // Check if the user has write permissions (non-blocking)
        try {
            const admin = new mongoose.mongo.Admin(conn.connection.db);
            const status = await admin.serverStatus();
            if (status.readOnly) {
                console.warn("⚠️ WARNING: Your database user has READ-ONLY access. Updates and password resets will fail.");
            }
        } catch (statusError) {
            console.warn(`⚠️ WARNING: Could not check database user permissions (serverStatus failed). Error: ${statusError.message}`);
            console.warn("   Ensure your MongoDB user has 'Read and write to any database' role for full functionality.");
        }
    } catch (error) {
        console.error("❌ Database connection failed!");
        const isAuthError = error.message.toLowerCase().includes("auth failed") || 
                           error.message.toLowerCase().includes("bad auth") || 
                           error.message.toLowerCase().includes("authentication failed");
        
        if (isAuthError) {
            console.error("❌ Authentication Failed: MongoDB rejected your credentials.");
            console.error("👉 Authentication Hint:");
            console.error("1. Verify the user exists in MongoDB Atlas -> Database Access.");
            
            if (URI && URI.includes(" ")) {
                console.error("⚠️ CRITICAL: Your MONGODB_URI contains a space. This is not allowed.");
                console.error("   Fix: Ensure there are no spaces in your connection string in the .env file.");
            }
            
            // Check for unencoded characters in the password section (between // and @)
            const credentialsPart = URI ? URI.split('//')[1]?.split('/')[0]?.split('@')[0] : "";
            const [username, password] = credentialsPart ? credentialsPart.split(':') : ["", ""];
            
            console.log(`👤 Attempting connection as user: "${username}"`);

            if (password && (password.includes('@') || password.includes('#') || password.includes(':'))) {
                console.error("⚠️ CRITICAL: Your password contains unencoded special characters.");
                console.error("   Fix: Change '@' to '%40', '#' to '%23', and ':' to '%3A' in your .env file.");
            }
            
            console.error("2. Ensure special characters (#, :, +, !) are URL-encoded.");
            console.error("4. Check for accidental quotes or spaces in your .env file.");
            console.log(`Current URI starts with: ${URI ? URI.substring(0, 25) + "..." : "null"}`);
        } else {
            console.error("Error details:", error.message);
        }
        process.exit(1); // Exit with an error code
    }
};
module.exports=connectDB;