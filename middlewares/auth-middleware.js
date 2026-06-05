const jwt=require('jsonwebtoken');
const User=require("../models/user-model");

const authMiddleware=async(req,res,next)=>{  
const token =req.header("Authorization");

if(!token){
    return res
    .status(401)
    .json({message:"Unauthorized HTTP,Token not provided"});
}

const jwtToken = token.startsWith("Bearer ") 
  ? token.slice(7) 
  : token;

try{
    const isVerified=jwt.verify(jwtToken,process.env.JWT_SECRET_KEY);
  
    const userData=await User.findOne({email:isVerified.email}).select({password:0,});
    
    if (!userData) {
        return res.status(401).json({ message: "Unauthorized. User no longer exists." });
    }

    req.user=userData;
    req.token=token;
    req.userID=userData._id;

    next();
}catch(error){
    return res.status(401).json({message:"Unauthorized.Invalid token"});
 
}

}; 
module.exports=authMiddleware;