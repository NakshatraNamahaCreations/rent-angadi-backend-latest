const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    }
})

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;