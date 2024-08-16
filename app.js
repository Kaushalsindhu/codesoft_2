// REQUIRING PACKAGES
const express = require('express');
const app = express();
const port = 3000;
const ejs = require('ejs');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config()

// REQUIRING FROM OTHER FILES
const Quiz = require('./models/quiz');
const User = require('./models/user');
const Question = require('./models/question')
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/expressError');
const userRouter = require('./routes/user');
const quizRouter = require('./routes/quiz');
const questionRouter = require('./routes/question');
const multer = require('multer');
const {storage} = require('./cloudConfig');
const upload = multer({storage});

// SETTING EJS & METHOD-OVERRIDE
// CONFIGURING EXPRESS TO READ URL-ENCODED AND JSON DATA
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname,'/public')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));

// DATABASE SETUP
// const MongoUrl = 'mongodb://127.0.0.1:27017/quizquest';
const dbUrl = process.env.ATLASDB_URL;
async function main(){
    await mongoose.connect(dbUrl);
}
main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{ 
    console.log("ERROR",err);
})

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24*3600,
});
store.on('error',(err)=>{
    console.log("ERROR in MONGO SESSION STORE", err);
})

// SETTING SESSION 
const sessionOptions = {
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,  
    }   
};
app.use(session(sessionOptions));

// SETTING CONNECT FLASH
app.use(flash());

// SETTING PASSPORT LOCAL AND GOOGLE STRATEGY
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://quizquest-cf5s.onrender.com/auth/google/callback"  
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          return cb(null, user);
        } else {
            console.log(profile);
          user = new User({
            email: profile.emails[0].value,
            username: profile.displayName
          });
          await user.save();
          return cb(null, user);
        }
    } catch (err) {
        console.log(err);
        return cb(err);
    }
  }
));

passport.serializeUser(function(user, cb){
    cb(null,user.id);
});
passport.deserializeUser(async function(id, cb){
    try{
        const user = await User.findById(id);
        cb(null, user);
    }catch(err){
        cb(err,null);
    }
});

// SETTING RES.LOCALS
app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.failure = req.flash("failure");
    res.locals.currUser = req.user;
    next();
})

// ROUTING
app.use("/",userRouter);
app.use("/quiz",quizRouter);
app.use("/question",questionRouter);

app.get("/",wrapAsync(async (req,res)=>{
    const user = await User.find({username:'Kaushal Sindhu'}).populate('quizzes');
    let featuredQuizzes = user[0].quizzes;
    res.render("pages/home.ejs",{featuredQuizzes});
}));

app.get("/about",(req,res)=>{
    res.render('pages/about.ejs');
})

 
// ERROR HANDLING MIDDLEWARES
app.all("*", (req,res,next)=>{
    next(new ExpressError(404, "Page Not Found !"))
})

app.use((err,req,res,next)=>{
    let {statusCode= 500, message= "Something went Wrong"} = err;
    res.render("pages/error.ejs",{statusCode,message});
})

app.listen(port, ()=>{
    console.log(`Server listening to requests at port ${port}`);
})
