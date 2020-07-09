const mongoose = require('mongoose')

const allActivitiesSchema = new mongoose.Schema({
    activityID: { type: String, required: true },
    name: { type: String },
    distance: { type: String },
    moving_time: { type: Number },
    elapsed_time: { type: Number },
    type: { type: String },
    start_date_local: { type: Date },
    average_speed: { type: Number },
    max_speed: { type: Number },

})

const oneActivitySchema = new mongoose.Schema({
    activityID: { type: String, required: true },
    name: { type: String },
    distance: { type: String },
    moving_time: { type: Number },
    elapsed_time: { type: Number },
    type: { type: String },
    start_date_local: { type: Date },
    average_speed: { type: Number },
    max_speed: { type: Number },
    elev_high: { type: Number },
    elev_low: { type: Number },
    calories: { type: Number },
})

const userSchema = new mongoose.Schema({
    stravaID: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String },
    location: { type: String },
    created_at: { type: Date },
    profile: { type: String },
    allActivities: [{ type: Object }],
},
    {
        timestamps: true
    })

const stravaUsers = mongoose.model('stravaUsers', userSchema)

module.exports = stravaUsers