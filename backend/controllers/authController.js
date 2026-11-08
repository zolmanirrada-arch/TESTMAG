const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const token = (u) =>
  jwt.sign(
    { id: u._id, name: u.name, username: u.username, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  username: u.username,
  email: u.email,
  role: u.role,
  isAdmin: Boolean(process.env.ADMIN_EMAIL && u.email === process.env.ADMIN_EMAIL.trim().toLowerCase()),
  mustChangePassword: u.mustChangePassword,
});
exports.register = async (req, res) => {
  try {
    let { name, username, email, password, role } = req.body;
    username = (username || "").trim().toLowerCase();
    email = (email || "").trim().toLowerCase();
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: "Барлық өрісті толтырыңыз" });
    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res
        .status(400)
        .json({ message: "Логин немесе email бұрын тіркелген" });
    const u = await User.create({
      name,
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: "student",
    });
    res.status(201).json({ token: token(u), user: publicUser(u) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = await User.findOne({
      username: (username || "").trim().toLowerCase(),
    });
    if (
      !u ||
      u.isBlocked ||
      !(await bcrypt.compare(password || "", u.password))
    )
      return res.status(400).json({ message: "Логин немесе құпиясөз қате" });
    res.json({ token: token(u), user: publicUser(u) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.me = async (req, res) => {
  const u = await User.findById(req.user.id).select("-password");
  if (!u) return res.status(404).json({ message: "Пайдаланушы табылмады" });
  res.json(publicUser(u));
};
exports.updateProfile = async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Пайдаланушы табылмады" });
    const { name, username, email, currentPassword, newPassword } = req.body;
    if (name) u.name = name.trim();
    if (username && username.trim().toLowerCase() !== u.username) {
      const v = username.trim().toLowerCase();
      if (await User.findOne({ username: v, _id: { $ne: u._id } }))
        return res.status(400).json({ message: "Бұл логин бос емес" });
      u.username = v;
    }
    if (email && email.trim().toLowerCase() !== u.email) {
      const v = email.trim().toLowerCase();
      if (await User.findOne({ email: v, _id: { $ne: u._id } }))
        return res.status(400).json({ message: "Бұл email тіркелген" });
      u.email = v;
    }
    if (newPassword) {
      if (
        !currentPassword ||
        !(await bcrypt.compare(currentPassword, u.password))
      )
        return res.status(400).json({ message: "Қазіргі құпиясөз қате" });
      u.password = await bcrypt.hash(newPassword, 10);
      u.mustChangePassword = false;
    }
    await u.save();
    res.json({ token: token(u), user: publicUser(u) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const u = await User.findOne({ email });
    if (!u)
      return res.json({
        message: "Егер бұл email тіркелген болса, уақытша құпиясөз жіберіледі.",
      });
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    )
      return res.status(503).json({
        message:
          "Email жіберу әлі бапталмаған. .env файлына SMTP параметрлерін енгізіңіз.",
      });
    const nodemailer = require("nodemailer");
    const temp = crypto.randomBytes(5).toString("hex");
    u.password = await bcrypt.hash(temp, 10);
    u.mustChangePassword = true;
    await u.save();
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE) === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: u.email,
      subject: "TESTMAG уақытша құпиясөз",
      text: `Сіздің уақытша құпиясөзіңіз: ${temp}\nЛогин: ${u.username}\nКіргеннен кейін Профиль бөлімінде құпиясөзді өзгертіңіз.`,
    });
    res.json({ message: "Уақытша құпиясөз email-ға жіберілді." });
  } catch (e) {
    res.status(500).json({ message: "Email жіберу қатесі: " + e.message });
  }
};

exports.deleteAccount=async(req,res)=>{try{
 const u=await User.findById(req.user.id);
 if(!u)return res.status(404).json({message:'Аккаунт табылмады'});
 if(!(await bcrypt.compare(req.body.password||'',u.password)))return res.status(403).json({message:'Құпиясөз қате'});
 if(u.email===(process.env.ADMIN_EMAIL||'').trim().toLowerCase())return res.status(403).json({message:'Негізгі әкімші аккаунтын жоюға болмайды'});
 const Test=require('../models/Test'),Question=require('../models/Question'),Result=require('../models/TestResult');
 const owned=await Test.find({creator:u._id}).select('_id');const ids=owned.map(x=>x._id);
 await Result.deleteMany({$or:[{student:u._id},{testId:{$in:ids}}]});
 await Question.deleteMany({testId:{$in:ids}});await Test.deleteMany({_id:{$in:ids}});
 await u.deleteOne();res.json({ok:true});
 }catch(e){res.status(500).json({message:'Аккаунтты жою мүмкін болмады'});}};
