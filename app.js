import 'dotenv/config';  // import doenv
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; // step 1
import findOrCreate from "mongoose-findorcreate";


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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose); // step 5 add passportlocalmongoose to UserSchema as plugin 
// only works if it use mongoose.schema for the model creation/schema creation.   
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); // step 6  Creates a configured passport-local LocalStrategy instance that can be used in passport.

passport.serializeUser(function (user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => done(null, user))
        .catch(error => done(error, null)
        );
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home.ejs")
})

app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login " }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    }
);

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.get("/secrets", (req, res) => { // step 8
    User.find({ "secret": { $ne: null } }).then(foundUsers => {
        if (foundUsers) {
            res.render("secrets.ejs", { userWithSecrets: foundUsers })
        }
    }).catch(err => {
        console.log(err);
    });
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit.ejs")
    } else {
        res.redirect("/login")
    }
})

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;

    // console.log(req.user);
    User.findById(req.user.id)
        .then(foundUser => {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                return foundUser.save();
            }
        })
        .then(() => {
            res.redirect("secrets");
        })
        .catch(err => {
            console.log(err);
        });

})

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