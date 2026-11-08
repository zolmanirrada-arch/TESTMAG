const Result = require("../models/TestResult"),
  Test = require("../models/Test"),
  Question = require("../models/Question"), User = require("../models/User");
exports.check = async (req, res) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Сұрақ табылмады" });
    res.json({
      isCorrect: selectedAnswer === q.correctAnswer,
      correctAnswer: q.correctAnswer,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.submit = async (req, res) => {
  try {
    const { testId, answers, timeSpent } = req.body;
    const t = await Test.findById(testId);
    if (!t) return res.status(404).json({ message: "Тест табылмады" });
    const qs = await Question.find({ testId });
    let correct = 0,
      score = 0,
      maxScore = 0;
    const checked = qs.map((q) => {
      maxScore += q.points;
      const a = (answers || []).find(
        (x) => String(x.questionId) === String(q._id),
      );
      const selected = a?.selectedAnswer || null,
        isCorrect = selected === q.correctAnswer;
      if (isCorrect) {
        correct++;
        score += q.points;
      }
      return {
        questionId: q._id,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        pointsEarned: isCorrect ? q.points : 0,
      };
    });
    const r = await Result.create({
      testId,
      student: req.user.id,
      studentName: req.user.name,
      answers: checked,
      correctCount: correct,
      incorrectCount: qs.length - correct,
      totalQuestions: qs.length,
      score,
      maxScore,
      percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
      timeSpent: Number(timeSpent) || 0,
    });
    res.status(201).json(r);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.history=async(req,res)=>{try{
 let filter={student:req.user.id};
 if(req.user.role==='teacher'){
  const students=await User.find({role:'student'}).select('_id');
  filter={student:{$in:[req.user.id,...students.map(x=>x._id)]}};
 }
 const rows=await Result.find(filter).populate('testId','title').populate('student','name username role').sort({completedAt:-1});
 res.json(rows.filter(x=>x.student).map(x=>({
  _id:x._id,studentName:x.studentName,student:x.student,testId:x.testId,
  score:x.score,maxScore:x.maxScore,percentage:x.percentage,completedAt:x.completedAt,
  isOwn:String(x.student._id)===String(req.user.id)
 })));
 }catch(e){res.status(500).json({message:e.message});}};
exports.detail=async(req,res)=>{try{
 const r=await Result.findById(req.params.id).populate('student','role');
 if(!r)return res.status(404).json({message:'Нәтиже табылмады'});
 const own=String(r.student?._id)===String(req.user.id);
 if(!own&&!(req.user.role==='teacher'&&r.student?.role==='student'))return res.status(403).json({message:'Рұқсат жоқ'});
 const qs=await Question.find({_id:{$in:r.answers.map(a=>a.questionId)}});
 const byId=new Map(qs.map(q=>[String(q._id),q]));
 const mistakes=r.answers.filter(a=>!a.isCorrect).map((a,i)=>{
  const q=byId.get(String(a.questionId));
  return {questionId:a.questionId,questionText:q?.questionText||'Сұрақ өзгертілген немесе жойылған',
   questionNumber:r.answers.findIndex(x=>String(x.questionId)===String(a.questionId))+1,
   selectedAnswer:a.selectedAnswer,correctAnswer:a.correctAnswer,
   options:q?.options||[]};
 });
 res.json({testTitle:(await Test.findById(r.testId).select('title'))?.title||'Тест',score:r.score,maxScore:r.maxScore,percentage:r.percentage,mistakes});
 }catch(e){res.status(400).json({message:'Нәтижені ашу мүмкін болмады'});}};

// Result deletion is restricted to the administrator on the server.
exports.remove = async (req,res)=>{
  try {
    const mongoose=require('mongoose');
    if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({message:'Нәтиже ID жарамсыз'});
    const result=await Result.findByIdAndDelete(req.params.id);
    if(!result)return res.status(404).json({message:'Нәтиже табылмады'});
    res.json({message:'Нәтиже өшірілді'});
  }catch(e){res.status(500).json({message:'Нәтижені өшіру мүмкін болмады'});}
};
