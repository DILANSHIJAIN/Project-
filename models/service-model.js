const {Schema,model}=require("mongoose");

const serviceSchema=new Schema({
    service:{type:String,required:true },
    description:{type:String, required:true},
    detailedDescription:{type:String, required:false},
    price:{type:String ,required:true},
    provider:{type:String,required:true},
    reviews: [
        {
            username: String,
            comment: String,
            rating: Number,
            date: String,
        }
    ]
});
const Service = model("Service", serviceSchema);
module.exports=Service;