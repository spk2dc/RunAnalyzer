const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    stravaID: { type: Number, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    img: { type: String, required: true },
    qty: { type: Number, capped: true, min: 0 }
},
    {
        timestamps: true
    })

const stravaUsers = mongoose.model('stravaUsers', userSchema)

module.exports = stravaUsers