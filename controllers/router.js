const express = require('express');
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const router = express.Router();
require('dotenv').config()
const axios = require('axios').default;

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
let access_token = ''
let token_type = ''
let refresh_token = ''
let currentUserID = ''

//database schema
const stravaUsers = require('../models/stravaUsers.js')

router.use(express.urlencoded({ extended: true }))
router.use(methodOverride('_method'))

////////////////////////////////////////////////////
///////////////////// ROUTES //////////////////////
//////////////////////////////////////////////////

router.get('/', (req, res) => {
    res.render('index.ejs');
});

//prompt user to login
router.get('/login', (req, res) => {
    let scope = 'read_all,profile:read_all,activity:read_all'
    let redirect = `http://${req.get('host')}/user_overview`
    let url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirect}&approval_prompt=auto&scope=${scope}`

    console.log('current url: ', `${req.get('host')}${req.originalUrl}`)
    console.log('login url: ', url);

    res.redirect(url);
});

//page redirected to after login page
router.get('/user_overview', (req, res) => {
    // console.log('token: ', access_token, 'curruser: ', currentUserID.length);

    if (req.query.hasOwnProperty('code') && access_token.length < 1) {
        let exchangePromise = tokenAuthentication(req.query.code)
        // console.log('exchangePromise: ', exchangePromise);

        //when promise is complete then get authenticated token and basic user from the returned data
        exchangePromise.then((promiseData) => {
            // console.log('exchangePromise: ', promiseData.data);

            access_token = promiseData.data.access_token
            token_type = promiseData.data.token_type
            refresh_token = promiseData.data.refresh_token
            //id is returned as a number, convert to string
            currentUserID = promiseData.data.athlete.id.toString(10)

            //find user in database and update or upsert if doesn't exist
            const filter = { stravaID: currentUserID }
            const update = {
                "$set": {
                    stravaID: currentUserID,
                    firstname: promiseData.data.athlete.firstname,
                    lastname: promiseData.data.athlete.lastname,
                    username: promiseData.data.athlete.username,
                    location: `${promiseData.data.athlete.city}, ${promiseData.data.athlete.state}`,
                    created_at: promiseData.data.athlete.created_at,
                    profile: promiseData.data.athlete.profile,
                }
            }
            const options = { new: true, upsert: true }

            stravaUsers.findOneAndUpdate(filter, update, options, (err, foundUser) => {
                if (err) {
                    console.log('create athlete error: ', err);
                }
                // console.log('create athlete: ', foundUser);
                res.render('user_profile.ejs', { user: foundUser })

            })

        }).catch((err) => {
            console.log('login promise error', err);
        })
    } else if (currentUserID.length > 0) {
        stravaUsers.find({ stravaID: currentUserID }, (err, athlete) => {
            // console.log('elseif find athlete: ', athlete);
            res.render('user_profile.ejs', { user: athlete[0] })
        })
    }
})

//pull all activity data from Strava API and update user with it
router.post('/refresh/:id', (req, res) => {
    // console.log('req: ', req.query);

    getAllActivities(token_type, access_token).then((activities) => {
        const filter = { stravaID: req.params.id }
        const update = {
            $set: {
                allActivities: activities.data
            }
        }
        const options = { new: true }

        // console.log('update activities filter: ', filter, 'update: ', update);

        stravaUsers.findOneAndUpdate(filter, update, options, (err, foundUser) => {
            if (err) {
                console.log('all activities error: ', err);
            }
            // console.log('updated user: ', foundUser);
            getDetailedActivities(token_type, access_token, foundUser)
        })

        res.redirect('/user_overview')

    }).catch((err) => {
        console.log('get all activities promise error', err);
    })
})

//show page for each activity
router.get('/activity/:id', (req, res) => {
    // console.log('req: ', req.query);
    const filter = { stravaID: currentUserID }
    const options = { new: true }
    const activityID = req.params.id.toString(10)

    stravaUsers.findOne(filter, (err, foundUser) => {
        if (err) {
            console.log('show page find error: ', err);
        }
        // console.log('updated user activity: ', foundUser.detailedActivities[activityID]);

        //render page if activity id exists
        if (foundUser.detailedActivities.hasOwnProperty(activityID)) {
            res.render('activity_page.ejs', { user: foundUser, activityID: activityID })
            // res.send(foundUser.detailedActivities[activityID])

        }
    })
})

//delete user and logout
router.delete('/delete/:id', (req, res) => {
    // console.log('req: ', req.query);
    const id = req.params.id.toString(10)

    stravaUsers.deleteOne({ stravaID: id }, (err, foundUser) => {
        if (err) {
            console.log('delete user error: ', err);
        }
        console.log('deleted user: ', foundUser.firstname);
    })

    res.redirect('/')

})

////////////////////////////////////////////////////
///////////////////// ROUTES //////////////////////
//////////////////////////////////////////////////


////////////////////////////////////////////////////
//////////////////// METHODS //////////////////////
//////////////////////////////////////////////////

//upon successful login, request valid token from Strava API
let tokenAuthentication = (code) => {
    // console.log(`curl -X "POST" "https://www.strava.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&grant_type=authorization_code"`);

    // Send a POST request using Axios and return the promise
    return axios({
        method: 'post',
        url: 'https://www.strava.com/oauth/token',
        data: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
        }
    }).catch((err) => {
        console.log('axios token authentication error', err);
    })
}

//get all the user's activities
let getAllActivities = (token_type, access_token) => {
    // console.log(`curl -X "GET" "https://www.strava.com/api/v3/athlete/activities?before=&after=&page=1&per_page=30" "Authorization: ${token_type} ${access_token}"`);


    // Send a POST request using Axios and return the promise
    return axios({
        method: 'get',
        url: 'https://www.strava.com/api/v3/athlete/activities',
        data: {
            page: 1,
            per_page: 30
        },
        headers: {
            Authorization: `${token_type} ${access_token}`,
            Accept: 'application/json'
        }
    })
}

//get user's detailed activities for each one in allActivities array
let getDetailedActivities = (token_type, access_token, user) => {
    // console.log(`curl -X "GET" "https://www.strava.com/api/v3/athlete/activities?before=&after=&page=1&per_page=30" "Authorization: ${token_type} ${access_token}"`);
    let arrPromise = []
    let detailedObj = {}

    //loop through all activities and get detailed data for each one that does not already have it
    for (let i = 0; i < user.allActivities.length; i++) {
        let id = user.allActivities[i].id.toString(10)
        // console.log(`allActivities[${i}].${id} = `, user.allActivities[i].id);

        //if there is not already a detailed activity object then get the data for it from Strava
        if (!user.detailedActivities.hasOwnProperty(id)) {
            //send request to Strava to get detailed activity information
            arrPromise[i] = axios({
                method: 'get',
                url: `https://www.strava.com/api/v3/activities/${id}`,
                data: {
                    include_all_efforts: true
                },
                headers: {
                    Authorization: `${token_type} ${access_token}`,
                    Accept: 'application/json'
                }
            }).catch((err) => {
                console.log('axios get detailed activity error', err);
            })
        }
    }

    //once all calls to Strava are done add all the data to existing user's detailedActivities field
    Promise.allSettled(arrPromise).then((results) => {
        // console.log('result of all detail calls: ', results, 'first result data: ', results[0].value.data);

        for (let i = 0; i < results.length; i++) {
            let detailID = results[i].value.data.id
            user.detailedActivities[detailID] = results[i].value.data
        }

        //must save mongoose database object so added data is permanent
        user.save()

        // console.log('detailedActivities: ', user.detailedActivities);
    })
}

module.exports = router;


/*
SOURCES:

https://developers.strava.com/docs/getting-started/

https://developers.strava.com/docs/authentication/

http://developers.strava.com/docs/reference/

https://developers.strava.com/playground/

https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express

https://stackoverflow.com/questions/19485353/function-to-convert-timestamp-to-human-date-in-javascript/34900794

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

https://mongoosejs.com/docs/api.html

https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss

*/