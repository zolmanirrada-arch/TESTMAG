const mongoose=require('mongoose');
const s=new mongoose.Schema({
 name:{type:String,required:true,trim:true},
 username:{type:String,required:true,unique:true,sparse:true,lowercase:true,trim:true,minlength:3},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true},
 password:{type:String,required:true},
 role:{type:String,enum:['teacher','student'],default:'student'},
 mustChangePassword:{type:Boolean,default:false},
 isBlocked:{type:Boolean,default:false}
},{timestamps:true});
module.exports=mongoose.model('User',s);
