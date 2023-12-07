// import 'dotenv/config';  // import doenv
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session"; // Step 1 import necessary packages
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";


const app = express();
const port = 3000;

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({   // step 2 session with initial configration
    secret: "It is a Secret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize()); // step 3 Passport initialize
app.use(passport.session());  // step 4 passport session

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({  // Add Schema from mongoose
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose); // step 5 add passportlocalmongoose to UserSchema as plugin 
// only works if it use mongoose.schema for the model creation/schema creation.   

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); // step 6  Creates a configured passport-local LocalStrategy instance that can be used in passport.

passport.serializeUser(User.serializeUser()); // Create cookie
passport.deserializeUser(User.deserializeUser()); //  find what in cookie

app.get("/", (req, res) => {
    res.render("home.ejs")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.get("/secrets", (req, res) => { // step 8
    if (req.isAuthenticated()) {
        res.render("secrets.ejs")
    } else {
        res.redirect("/login")
    }
});

app.get('/logout', function (req, res) { // step 10
    req.logout(function (err) {
        if (err) { return next(err); }
    })

    res.redirect('/'); // or wherever you want to redirect after logout
});

app.post("/register", (req, res) => { // step 7

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            })
        }
    })
});


app.post("/login", (req, res) => { // step 9
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets')
            })
        }
    })

})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})