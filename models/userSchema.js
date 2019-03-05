var mongoose = require("mongoose");
var userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: {
        type: String,
        unique: true
    },
    password: String
});

module.exports = {
    user: mongoose.model("user", userSchema),
};