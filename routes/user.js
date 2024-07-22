const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const {validateUser, saveRedirectUrl} = require('../middlewares');
const wrapAsync = require('../utils/wrapAsync');

router.get("/login",(req,res)=>{
    res.render("pages/login.ejs");
})

router.get("/auth/google",saveRedirectUrl, passport.authenticate("google",
    {scope: ["profile","email"]}
))

router.get("/auth/google/callback",saveRedirectUrl, passport.authenticate("google",
    {failureRedirect: "/login"}), 
    async (req,res) => {
        req.session.redirectUrl = res.locals.redirectUrl;
        res.redirect("/checkAuthentic");
    }
)

router.get("/checkAuthentic",saveRedirectUrl, (req,res)=>{
    if(req.isAuthenticated()){
        const redirectUrl = res.locals.redirectUrl || "/"
        delete req.session.redirectUrl;
        req.flash("success","Login Successful !");
        res.redirect(redirectUrl);
    }else{
        res.redirect("/login");
    }
})

router.post("/signup", validateUser, wrapAsync(async (req,res)=>{
    let {username, email, password} = req.body;
    console.log(req.body);
    let existing = await User.findByUsername(username);
    if(existing){
        req.flash("failure","Username already exists");
        res.redirect("/login")
        return;
    }
    let newUser = new User({username,email});
    let registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.flash("success","Registration Successful !");
    res.redirect("/");
}))

router.post("/login", saveRedirectUrl, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('failure', 'Incorrect Username or Password');
            return res.redirect('/login');
        }
        req.logIn(user, async (err) => {
            if (err) {
                return next(err);
            }
            try {
                const currUser = await User.findOne({ username: req.body.username });
                if (!currUser) {
                    req.flash('error', 'Incorrect Username or Password');
                    return res.redirect('/login');
                }
                req.flash('success', 'Login Successful!');
                return res.redirect(res.locals.redirectUrl || '/');
            } catch (err) {
                return next(err);
            }
        });
    })(req, res, next);
});

router.get("/logout", (req,res)=>{
    req.logout(function(err){
        if(err) {
            console.log(err);
        }else {
            res.redirect("/login");
        }
    })
})


module.exports = router;

