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
    let redirect = 'http://localhost:3000/exchange_token'
    let url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirect}&approval_prompt=auto&scope=${scope}`
    res.redirect(url);
});

//page redirected to after login page
router.get('/exchange_token', (req, res) => {
    // console.log('req: ', req.query);

    if (req.query.hasOwnProperty('code')) {
        let exchangeData = []
        exchangeData[0] = tokenAuthentication(req.query.code)

        Promise.allSettled(exchangeData).then((data) => {
            console.log('promise: ', exchangeData);
            console.log('data: ', data);
            res.send(data);
        })
    }
});

//upon successful login, request valid token from Strava API
let tokenAuthentication = (code) => {

    // Send a POST request using Axios
    return axios({
        method: 'post',
        url: 'https://www.strava.com/oauth/token',
        data: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code'
        }
    }).then((data) => {
        console.log('tokenAuthentication: ',data);
    });


}

module.exports = router;