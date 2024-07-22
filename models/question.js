const { required } = require('joi');
const mongoose = require('mongoose');
const { type } = require('../schema');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    ques: {
        type: String,
        required: true
    },
    image: {
        filename: String,
        url: String,
    },
    options: [{
        type: String,
        required: true
    }],
    answer: {
        type: Number,
        required: true
    },
    parentQuiz: {
        type: Schema.Types.ObjectId,
        ref: "Quiz"
    }
})

const Question = mongoose.model("Question",questionSchema);
module.exports = Question;