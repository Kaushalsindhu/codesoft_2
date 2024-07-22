const mongoose = require('mongoose');
const Question = require('./question');
const Schema = mongoose.Schema;
const wrapAsync = require('../utils/wrapAsync');
const { cloudinary } = require('../cloudConfig');

const quizSchema = new Schema({
    quizname: {
        type: String,
        required: true
    },
    quesNumbers: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        filename: String,
        url: String
    },
    questions: [{
        type: Schema.Types.ObjectId,
        ref: "Question"
    }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

quizSchema.post("findOneAndDelete",async (quiz) => {
    if(quiz){
        const questions = await Question.find({_id: {$in: quiz.questions}});
        for (let question of questions) {
            if (question.image && question.image.filename) {
                await cloudinary.uploader.destroy(question.image.filename);
            }
        }
    }
    if (quiz) {
        await Question.deleteMany({_id: {$in: quiz.questions}});
        await cloudinary.uploader.destroy(quiz.image.filename);
    }
});

const Quiz = mongoose.model("Quiz",quizSchema);
module.exports = Quiz;