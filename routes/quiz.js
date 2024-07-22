const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Quiz = require('../models/quiz');
const {isLoggedIn, validateQuiz} = require('../middlewares');
const wrapAsync = require('../utils/wrapAsync');
const multer = require('multer');
const {storage} = require('../cloudConfig');
const upload = multer({storage});

router.get("/explore",wrapAsync( async (req,res)=>{
    let allQuizzes = await Quiz.find({});
    res.render("pages/explore.ejs",{allQuizzes});
}))

router.get("/new",isLoggedIn, (req,res)=>{
    if (req.session.quizCreated) {
      const formData = req.session.formData;
      return res.render("pages/newQuiz.ejs", {formData, quizId: req.session.quizId, currentQuestionIndex: req.session.currentQuestionIndex || 0});
    }
    res.render("pages/newQuiz.ejs", {formData: {quizname: '', quesNumbers: 0, description: '',currentQuestionIndex:0, quizCreated: false}});
})

router.post('/',upload.single('image') ,validateQuiz, wrapAsync(async (req, res) => {
    const { quizname, quesNumbers, description } = req.body;
    const newQuiz = new Quiz({
      quizname,
      quesNumbers,
      description,
      creator: req.user._id,
    }); 
    newQuiz.image = {
      filename: req.file.filename,
      url: req.file.path,
    }

    const currUser = await User.findOne({username: req.user.username});
    currUser.quizzes.push(newQuiz);
    let savedQuiz = await newQuiz.save();
    req.session.quizCreated = true;
    req.session.quizId = savedQuiz._id;
    req.session.formData = { quizname, quesNumbers, description, quizCreated: req.session.quizCreated};
    await currUser.save();
    res.redirect("/quiz/new");
}));

router.delete('/reset',wrapAsync(async (req, res) => {
    // Clear the session data related to the quiz form
    const quiz = await Quiz.findByIdAndDelete(req.session.quizId);
    delete req.session.quizCreated;
    delete req.session.formData;
    delete req.session.quizId;
    delete req.session.currentQuestionIndex;
    res.redirect('/quiz/new');
}));

router.get('/created',async (req,res) => {
  delete req.session.currentQuestionIndex;
  delete req.session.quizCreated;
  delete req.session.formData;
  delete req.session.quizId;
  res.redirect('/quiz/explore');
});

router.get('/:quizId/show', async (req,res)=>{
    let {quizId} = req.params;
    let quiz = await Quiz.findById(quizId);
    let creator = await User.findById(quiz.creator);
    let creatorName = creator.username;
    res.render('pages/show.ejs',{quiz, creatorName});
})

router.delete('/:quizId/delete', async(req,res)=>{
    let {quizId} = req.params;
    await Quiz.findByIdAndDelete(quizId);
    req.flash("success","Listing Deleted!");
    res.redirect('/quiz/explore');
})

router.get('/:quizId/test',wrapAsync(async (req,res)=>{
    let quiz = await Quiz.findById(req.params.quizId).populate('questions');
    let questions = quiz.questions;

    const transformQuestions = (questions) => {
      return questions.map((question) => ({
        question: question.ques,
        answers: question.options.map((option, index) => ({
          text: option,
          correct: (index+1 == question.answer) ? true : false
        })),
        image: question.image.url
      }));
    };
    const transformedQuestions = transformQuestions(questions);

    res.render("pages/test.ejs",{quiz, questions:transformedQuestions}) ;
}))

module.exports = router;
