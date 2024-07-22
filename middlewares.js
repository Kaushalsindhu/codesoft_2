const {userSchema, quizSchema, questionSchema} = require("./schema");
const ExpressError = require("./utils/expressError");
const Joi = require('joi');

const validateUser = (req,res,next) => {
    let {error} = userSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
}

const validateQuiz = (req,res,next) => {
    let {error} = quizSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    } 
    else{
        next();
    }
}

const validateQuestion = (req,res,next) => {
    let {ques, options, answer} = req.body;
    let {error} = questionSchema.validate({ques, options, answer});
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
}

const isLoggedIn = (req,res,next) => {
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("failure","Login required");
        return res.redirect("/login");
    }
    next();
}

const saveRedirectUrl = (req,res,next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports = {
    validateUser,
    validateQuiz,
    validateQuestion,
    isLoggedIn,
    saveRedirectUrl
} 