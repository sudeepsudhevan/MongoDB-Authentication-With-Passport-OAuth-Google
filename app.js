// import 'dotenv/config';  // import doenv
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
const saltRounds = 10;

const app = express();
const port = 3000;

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({  // Add Schema from mongoose
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);


app.get("/", (req, res) => {
    res.render("home.ejs")
})

app.get("/login", (req, res) => {
    res.render("login.ejs")
})

app.get("/register", (req, res) => {
    res.render("register.ejs")
})

app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds).then(function (hash) { // bcrypt salt + hash
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save()
            .then(() => { // promise
                res.render("secrets.ejs");
            }).catch((err) => {
                console.log(err);
            });
    }).catch((err) => {
        console.log(err);
    });
});


app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }).then((foundUser) => {
        if (foundUser) {
            bcrypt.compare(password, foundUser.password).then(function (result) {
                if (result == true) {
                    res.render("secrets.ejs");
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})