import 'dotenv/config';  // import doenv
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import md5 from "md5";

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
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save()
        .then(() => { // promise
            res.render("secrets.ejs");
        }).catch((err) => {
            console.log(err);
        });
});

// console.log(md5("qwerty"));

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);  // md5 hash will always be same, but not easy to decrypt

    User.findOne({ email: username }).then((foundUser) => {
        if (foundUser) {
            if (foundUser.password === password) {
                res.render("secrets.ejs");
            }
        }
    }).catch((err) => {
        console.log(err);
    });
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})