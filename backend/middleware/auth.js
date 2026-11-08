const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.auth = async (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Авторизация қажет" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(req.user.id);
    if (!user || user.isBlocked)
      return res
        .status(403)
        .json({ message: "Аккаунт бұғатталған немесе жойылған" });
    req.user.role = user.role;
    req.user.name = user.name;
    next();
  } catch (e) {
    res.status(401).json({ message: "Токен жарамсыз" });
  }
};
exports.teacher = (req, res, next) =>
  req.user.role === "teacher"
    ? next()
    : res.status(403).json({ message: "Мұғалім рөлі қажет" });
