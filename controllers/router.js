const express = require('express');
const router = express.Router();
require('dotenv').config()

const CLIENT_ID = process.env.CLIENT_ID

router.get('/', (req, res) => {
    res.send(`Testing environment variable ${CLIENT_ID}`);
});

module.exports = router;