const Test=require('../models/Test'),Question=require('../models/Question');
exports.create=async(req,res)=>{try{const{title,description,timeLimit,questions,sourceType,documentId}=req.body;if(!title||!Array.isArray(questions)||!questions.length)return res.status(400).json({message:'Тест атауы және сұрақтар қажет'});const t=await Test.create({title,description,timeLimit:Number(timeLimit)||10,creator:req.user.id,sourceType:sourceType||'manual',documentId:documentId||null});const qs=await Question.insertMany(questions.map((q,i)=>({testId:t._id,questionText:q.questionText,options:q.options,correctAnswer:q.correctAnswer,points:q.points||1,order:i+1})));t.questionIds=qs.map(q=>q._id);await t.save();res.status(201).json(t);}catch(e){res.status(500).json({message:e.message});}};
exports.list=async(req,res)=>res.json((await Test.find({isPublished:true}).sort({createdAt:-1})).map(t=>({...t.toObject(),questionCount:t.questionIds?.length||0,questionIds:undefined})));
exports.mine=async(req,res)=>res.json((await Test.find({creator:req.user.id}).sort({createdAt:-1})).map(t=>({...t.toObject(),questionCount:t.questionIds?.length||0})));
exports.getForEdit=async(req,res)=>{try{const t=await Test.findOne({_id:req.params.id,creator:req.user.id}).populate('questionIds');if(!t)return res.status(404).json({message:'Тест табылмады'});res.json(t);}catch(e){res.status(500).json({message:e.message});}};
exports.update=async(req,res)=>{try{const t=await Test.findOne({_id:req.params.id,creator:req.user.id});if(!t)return res.status(404).json({message:'Тест табылмады'});const{title,description,timeLimit,questions}=req.body;if(!title||!Array.isArray(questions)||!questions.length)return res.status(400).json({message:'Тест атауы және сұрақтар қажет'});await Question.deleteMany({testId:t._id});const qs=await Question.insertMany(questions.map((q,i)=>({testId:t._id,questionText:q.questionText,options:q.options,correctAnswer:q.correctAnswer,points:q.points||1,order:i+1})));t.title=title;t.description=description||'';t.timeLimit=Number(timeLimit)||10;t.questionIds=qs.map(q=>q._id);await t.save();res.json(t);}catch(e){res.status(500).json({message:e.message});}};
exports.play=async(req,res)=>{try{let t=await Test.findById(req.params.id).populate({path:'questionIds',select:'questionText options points order'});if(!t)return res.status(404).json({message:'Тест табылмады'});const data=t.toObject();if(!data.questionIds?.length)data.questionIds=await Question.find({testId:t._id}).select('questionText options points order').sort({order:1});res.json(data);}catch(e){res.status(500).json({message:e.message||'Тестті ашу кезінде қате шықты'});}};

// Only the teacher who created the test may delete it.
exports.remove=async(req,res)=>{
  try{
    const mongoose=require('mongoose');
    const TestResult=require('../models/TestResult');
    if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:'Тест ID жарамсыз'});
    const test=await Test.findOne({_id:req.params.id,creator:req.user.id});
    if(!test)return res.status(404).json({message:'Тест табылмады немесе өшіруге рұқсатыңыз жоқ'});
    // Remove related questions and results to avoid orphaned records.
    await TestResult.deleteMany({testId:test._id});
    await Question.deleteMany({testId:test._id});
    await Test.deleteOne({_id:test._id,creator:req.user.id});
    res.json({message:'Тест өшірілді'});
  }catch(e){res.status(500).json({message:'Тестті өшіру кезінде қате шықты'});}
};
