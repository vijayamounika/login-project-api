const express = require("express"); //return a function
var cors = require('cors');
const app = express(); //express function returns app object
var bodyParser = require("body-parser");
var bcrypt = require("bcryptjs");
app.use(bodyParser.json()); // support json encoded bodies
app.use(cors()) // allow cors requests
app.options('*', cors())
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies
var jwt = require("jsonwebtoken");
var path = require("path");
var config = require(path.resolve(__dirname, "./config.js"));
var mongoose = require("mongoose");
var mongoDB = "mongodb://localhost:27017/coding_challenge";
mongoose.connect(mongoDB);
//mongoose.Promise = global.Promise;
//when successfully connected
var db = mongoose.connection;
db.on("connected", function () {
    console.log("Mongoose default connection  open to " + mongoDB);
});
//if the connection throws an error
db.on("error", console.error.bind(console, "MongoDB connection error:"));
var myModels = require("./models/userSchema.js");
var user = myModels.user;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.post("/userregistration", function (req, res, next) {
    var firstName = req.body.firstname;
    var lastName = req.body.lastname;
    var email = req.body.email;
    var password = req.body.password;
    var salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(password, salt);
    var myData = new user(req.body);
    user.find({
        email: email
    }).then(
        result => {
            if (result.length > 0) {
                throw new Error("email is already registered");
            } else {
                myData
                    .save()
                    .then(item => {
                        res.status(200).send({
                            status: 1,
                            message: "Registration Successfull"
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        throw new Error("Registration Unsuccessfull");
                    });
            }
        },
        err => {
            res.send(err);
        }
    ).catch(next);
});

app.post("/login", function (req, res, next) {
    var email = req.body.email;
    var pwd = req.body.password;
    var doc = user.findOne({
        email: email
    }).then(
        result => {
            if (result == null) {
                throw new Error("Incorrect email");
            }
            var compareResult = bcrypt.compareSync(pwd, result.password);
            if (compareResult) {
                var token = jwt.sign({
                    id: result._id
                }, config.secret, {
                    expiresIn: 86400
                });
                res
                    .status(200)
                    .send({
                        auth: true,
                        token: token,
                        status: 1,
                        message: "Login Successfull"
                    });
            } else {
                throw new Error("password is Incorrect");
            }
        },
        err => {
            res.send(err);
        }
    ).catch(next);
});

function pathMiddleware(req, res, next) {
    var token = req.headers["x-access-token"];
    if (!token)
        return res.status(401).send({
            auth: false,
            message: "No token provided."
        });
    jwt.verify(token, config.secret, function (err, decoded) {
        if (err)
            //throw new Error("Failed to authenticate token");
            return res
                .status(501)
                .send({
                    auth: false,
                    message: "Failed to authenticate token"
                });
        user.findOne({
            _id: decoded.id
        }).then(
            result => {
                if (result) {
                    req.user = result;
                    next();
                } else {
                    throw new Error("Invalid Token");
                }
            },
            err => {
                res.send(err);
            }
        ).catch(next);

    });

}


app.get("/dashboard", pathMiddleware, function (req, res) {
    res.status(200).send({
        status: 1,
        message: "Hello World",
        name: req.user.firstname
    })

})


app.get("/", (req, res) => res.send("Hello mounika !!"));

app.use((err, req, res, next) => {
    res.status(500).send({
        status: 0,
        message: err.message,
        error: err.stack
    })
});

app.listen(3000, () => console.log("Example is listening on port 3000"));