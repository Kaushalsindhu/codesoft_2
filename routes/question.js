const express = require('express');
const router = express.Router();
const Question = require('../models/question');
const Quiz = require('../models/quiz');
const wrapAsync = require('../utils/wrapAsync');
const multer = require('multer');
const {storage} = require('../cloudConfig');
const upload = multer({storage});
const {validateQuestion} = require('../middlewares');

router.post('/', upload.single('image'), validateQuestion ,wrapAsync(async (req, res) => {

  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);
    const {ques, options, answer, currentQuestionIndex} = req.body;
    const questionData = {ques, options, answer, parentQuiz: req.session.quizId};
  
    // Handle image upload if present
    if (req.file) {
      questionData.image = {
        filename: req.file.filename,
        url: req.file.path,
      };
    }
    
    const newQuestion = new Question(questionData);
    const savedQuestion = await newQuestion.save();
  
    const quizId = req.session.quizId;
    const quiz = await Quiz.findById(quizId);
    quiz.questions.push(savedQuestion._id);
    await quiz.save();

    req.session.currentQuestionIndex = parseInt(currentQuestionIndex) + 1;
    if (quiz.questions.length === quiz.quesNumbers) {
      delete req.session.currentQuestionIndex;
      delete req.session.quizCreated;
      delete req.session.formData;
      delete req.session.quizId;
      req.flash("success","Quiz Created");
      res.redirect('/quiz/explore');
    } else {
      res.redirect('/quiz/new');
    }
}));

module.exports = router;