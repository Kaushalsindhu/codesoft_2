const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const Quiz = require('./quiz');

const userSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    quizzes:[{
        type: Schema.Types.ObjectId,
        ref: "Quiz"
    }]
})

// Mongoose middleware to ensure if a user is deleted from database
// then all the quizzes created by him are also deleted

userSchema.post('findOneAndDelete', async (user) => {
    if(user){
        console.log("deleting");
        await Quiz.deleteMany({_id: {$in: user.quizzes}})
    } 
})

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User",userSchema);
module.exports = User; 