const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    stravaID: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String },
    location: { type: String },
    created_at: { type: Date },
    profile: { type: String },
    allActivities: { type: Array, "default": [] },
    detailedActivities: { type: Object, "default": {} },
},
    {
        timestamps: true
    })

const stravaUsers = mongoose.model('stravaUsers', userSchema)

module.exports = stravaUsers