const path = require("path");
const Doc = require("../models/UploadedDocument");
const { extractText, parseQuestions } = require("../services/documentParser");
exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Файл таңдаңыз" });
    const questions = parseQuestions(await extractText(req.file.path));
    const d = await Doc.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      parsedQuestionsCount: questions.length,
    });
    res.status(201).json({ document: d, questions });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
exports.list = async (req, res) =>
  res.json(await Doc.find({ owner: req.user.id }).sort({ createdAt: -1 }));
exports.download = async (req, res) => {
  const d = await Doc.findOne({ _id: req.params.id, owner: req.user.id });
  if (!d) return res.status(404).json({ message: "Файл табылмады" });
  res.download(path.resolve(d.filePath), d.originalName);
};
