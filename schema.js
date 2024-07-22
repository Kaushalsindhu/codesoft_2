const Joi = require('joi');

module.exports.userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email({minDomainSegments: 2, tlds:{allow: ['com','net']}}).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9@#$]{3,30}$')),
}).required();

module.exports.quizSchema = Joi.object({
    quizname: Joi.string().required(),
    quesNumbers: Joi.number().integer().min(1).max(10).required(),
    description: Joi.string().required(),
})
 
module.exports.questionSchema = Joi.object({
    ques: Joi.string().required(),
    options: Joi.array().items(Joi.string().required()).length(4).required(),
    answer: Joi.number().integer().min(1).max(4).required(),
})