const express = require('express');
const router = express.Router();
require('dotenv').config()
const axios = require('axios').default;

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

router.get('/', (req, res) => {
    res.send('homepage');
});

//prompt user to login
router.get('/login', (req, res) => {
    let scope = 'read_all,profile:read_all,activity:read_all'
    let redirect = `http://${req.get('host')}/exchange_token`
    let url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirect}&approval_prompt=auto&scope=${scope}`

    console.log('current url: ', `${req.get('host')}${req.originalUrl}`)
    res.redirect(url);
});

//page redirected to after login page
router.get('/exchange_token', (req, res) => {
    // console.log('req: ', req.query);

    if (req.query.hasOwnProperty('code')) {
        let exchangePromise = tokenAuthentication(req.query.code)
        // console.log('exchangePromise: ', exchangePromise);

        //when promise is complete then get authenticated token from the returned data
        exchangePromise.then((promiseData) => {
            // console.log('exchangePromise: ', promiseData.data);

            let access_token = promiseData.data.access_token
            let token_type = promiseData.data.token_type
            let refresh_token = promiseData.data.refresh_token


            getAllActivities(token_type, access_token).then((activities) => {
                res.render('user_profile.ejs', { user: promiseData.data.athlete, activities: activities.data })

            }).catch((err)=>{
                console.log('activities promise error');
                
            })
        }).catch((err)=>{
            console.log('login promise error', err);
            
        })


    }
});

//upon successful login, request valid token from Strava API
let tokenAuthentication = (code) => {
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

*/