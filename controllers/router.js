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

        exchangePromise.then((promiseData) => {
            // console.log('exchangePromise: ', promiseData.data);
            res.send(promiseData.data)
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

module.exports = router;


/*
SOURCES: 

https://developers.strava.com/docs/getting-started/

https://developers.strava.com/docs/authentication/

http://developers.strava.com/docs/reference/

https://developers.strava.com/playground/

https://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express

*/