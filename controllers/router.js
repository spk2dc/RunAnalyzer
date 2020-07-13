const express = require('express');
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const router = express.Router();
require('dotenv').config()
const axios = require('axios').default;

let CLIENT_ID = process.env.CLIENT_ID
let CLIENT_SECRET = process.env.CLIENT_SECRET

//database schema
const stravaUsers = require('../models/stravaUsers.js')

router.use(express.urlencoded({ extended: true }))
router.use(methodOverride('_method'))


////////////////////////////////////////////////////////////////
//////////////////////// ALL ROUTES ///////////////////////////
//////////////////////////////////////////////////////////////

//************************INDEX ROUTE**********************//
router.get('/', (req, res) => {
    //if session does not exist set default values
    if (!req.session.hasOwnProperty('access_token')) {
        req.session.access_token = ''
        req.session.token_type = ''
        req.session.refresh_token = ''
        req.session.currentUserID = ''
    }

    // console.log('req session: ', req.session);

    res.render('index.ejs');
});
//************************INDEX ROUTE**********************//

//*************************NEW ROUTE**********************//
//prompt new user to login using Strava API's login page with necessary scopes to read all of the user's public and private data
router.get('/login', (req, res) => {
    let scope = 'read_all,profile:read_all,activity:read_all'
    let redirect = `http://${req.get('host')}/user_overview`
    let url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirect}&approval_prompt=auto&scope=${scope}`

    console.log('current url: ', `${req.get('host')}${req.originalUrl}`)
    console.log('login url: ', url);

    res.redirect(url);
});
//*************************NEW ROUTE**********************//


//************************CREATE ROUTE**********************//
//login redirect page, create new user if they don't exist and then display user overview page
router.get('/user_overview', (req, res) => {
    // console.log('token: ', req.session.access_token, 'curruser: ', req.session.currentUserID.length);

    //if coming from login page and access token does not exist then get one
    if (req.query.hasOwnProperty('code') && req.session.access_token.length < 1) {
        //call method to get access token and get returned promise
        let exchangePromise = tokenAuthentication(req.query.code)
        // console.log('exchangePromise: ', exchangePromise);

        exchangePromise.then((promiseData) => {
            // console.log('exchangePromise: ', promiseData.data);

            //send in promise data to create user, request to pass session info, and response to render user overview page once they are created
            createUser(promiseData, req, res)

        }).catch((err) => {
            console.log('login promise error', err);
        })

    } else if (req.session.currentUserID.length > 0) {
        //if not redirecting from another page and if user also exists then find user and render their profile overview
        stravaUsers.find({ stravaID: req.session.currentUserID }, (err, athlete) => {
            // console.log('elseif find athlete: ', athlete);
            res.render('user_profile.ejs', { user: athlete[0] })
        })
    } else {
        //temporary catch all in case there is somehow a situation that does not fall into previous if statements
        res.send('Something went wrong. Either you have not logged in or your access token has expired and you need to log in again.')
    }
})
//************************CREATE ROUTE**********************//


//************************UPDATE ROUTE**********************//
//pull list of all activity data from Strava API and update user with it
router.post('/refresh/:id', (req, res) => {
    // console.log('req: ', req.query);

    getAllActivities(req.session.token_type, req.session.access_token).then((activities) => {
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
            getDetailedActivities(req.session.token_type, req.session.access_token, foundUser)
        })

        res.redirect('/user_overview')

    }).catch((err) => {
        console.log('get all activities promise error', err);
    })
})

//create a note for an individual activity
router.post('/activity/:id/note', (req, res) => {
    // console.log('req: ', req.body.customNote);
    const filter = { stravaID: req.session.currentUserID }
    const activityID = req.params.id.toString(10)

    stravaUsers.findOne(filter, (err, foundUser) => {
        if (err) {
            console.log('activity note update error: ', err);
        }
        // console.log('updated user note: ', filter);

        //render page if activity id exists
        if (foundUser.detailedActivities.hasOwnProperty(activityID)) {
            foundUser.detailedActivities[activityID].customNote = req.body.customNote
            //have to mark document's specific key that was modified in order for changes to be saved to database
            foundUser.markModified('detailedActivities')
            foundUser.save()

            res.redirect(`/activity/${activityID}`)
            // res.send(foundUser.detailedActivities[activityID])

        }
    })
})
//**********************UPDATE ROUTE**********************//


//***********************EDIT ROUTE**********************//
//edit page for a custom note for an individual activity
router.get('/activity/:id/note', (req, res) => {
    // console.log('req: ', req.body.customNote);
    const filter = { stravaID: req.session.currentUserID }
    const activityID = req.params.id.toString(10)

    stravaUsers.findOne(filter, (err, foundUser) => {
        if (err) {
            console.log('activity note edit error: ', err);
        }
        // console.log('edit user note: ', foundUser);

        //render page if activity id exists
        if (foundUser.detailedActivities.hasOwnProperty(activityID)) {
            res.render('custom_note.ejs', { user: foundUser, activityID: activityID })
            // res.send(foundUser.detailedActivities[activityID])

        }
    })
})
//***********************EDIT ROUTE**********************//


//***********************SHOW ROUTE**********************//
//show page for detailed data on each individual activity
router.get('/activity/:id', (req, res) => {
    // console.log('req: ', req.query);
    const filter = { stravaID: req.session.currentUserID }
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
//***********************SHOW ROUTE**********************//


//**********************DESTROY ROUTE**********************//
//delete user and all of their data, then logout and deauthenticate this website's access to their account
router.delete('/delete/:id', (req, res) => {
    // console.log('req: ', req.query);
    const id = req.params.id.toString(10)

    //remove this user from the Mongo database
    stravaUsers.deleteOne({ stravaID: id }, (err, deletedUser) => {
        if (err) {
            console.log('delete user error: ', err);
        }
        // console.log('deleted user: ', deletedUser);
    })

    //deauthorize this application from the user's Strava Account
    axios({
        method: 'post',
        url: 'https://www.strava.com/oauth/deauthorize',
        data: {
            access_token: req.session.access_token
        }
    })
        .then((data) => {
            // console.log(`deauthorized strava user: ${data.data}`, data.headers);

        })
        .catch((err) => {
            console.log('axios deauthorize error', err);
        })

    //redirect back to home page
    res.redirect('/logout')

})
//**********************DESTROY ROUTE**********************//


//**********************LOGOUT ROUTE**********************//
//delete user and all of their data, then logout and deauthenticate this website's access to their account
router.get('/logout', (req, res) => {
    let baseurl = req.get('host')

    //destroy user's session on logout
    req.session.destroy(() => {
        //redirect back to home page
        res.render('logout.ejs', { baseurl: baseurl })
    })


})
//**********************LOGOUT ROUTE**********************//

////////////////////////////////////////////////////////////////
//////////////////////// ALL ROUTES ///////////////////////////
//////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////
///////////////////////// METHODS /////////////////////////////
//////////////////////////////////////////////////////////////

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

//when token authentication promise is complete then save access tokens and create basic user from the returned data
let createUser = (promiseData, req, res) => {

    req.session.access_token = promiseData.data.access_token
    req.session.token_type = promiseData.data.token_type
    req.session.refresh_token = promiseData.data.refresh_token
    //id is returned as a number, convert to string
    req.session.currentUserID = promiseData.data.athlete.id.toString(10)
    // console.log('req user: ', req.session.currentUserID);

    //find user in database and update or upsert (create) if user doesn't exist. set data based on defined schema 
    const filter = { stravaID: req.session.currentUserID }
    const update = {
        "$set": {
            stravaID: req.session.currentUserID,
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
            //add field for custom notes in each activity
            results[i].value.data.customNote = ''
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

https://medium.com/javascript-in-plain-english/how-to-check-for-null-in-javascript-dffab64d8ed5

https://stackoverflow.com/questions/34753782/how-to-chain-redirects-in-node-express

https://www.w3schools.com/tags/tag_iframe.asp

https://groups.google.com/forum/#!topic/strava-api/DjfRRWsPFuk

https://www.w3docs.com/snippets/html/how-to-redirect-a-web-page-in-html.html

https://stackoverflow.com/questions/18145273/how-to-load-an-external-webpage-into-a-div-of-a-html-page

https://stackoverflow.com/questions/1655065/redirecting-to-a-relative-url-in-javascript

https://stackoverflow.com/questions/35733647/mongoose-instance-save-not-working

https://www.w3schools.com/bootstrap/bootstrap_tabs_pills.asp

*/