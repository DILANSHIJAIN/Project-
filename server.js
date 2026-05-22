require("dotenv").config();
const express=require("express");
const app=express();
const router=require("./router/auth-router");
const contactRoute=require("./router/contact-router");
const connectDb=require("./utils/db");
const errorMiddleware = require("./middlewares/error-middleware");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth",router);
app.use("/api/form",contactRoute);

app.use(errorMiddleware);

 app.get("/",(req,res)=>{
   res.status(200).send("Welcome to my coding channel");
});
console.log("registration start");
app.get("/register",(req,res)=>{
    res.status(200).send("Welcome at registration page");
});
const PORT=5000;
connectDb().then(()=>{
app.listen(PORT,()=>{
    console.log(`server is running at port:${PORT}`);
});
}); 
