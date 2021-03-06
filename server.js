//___________________
//Dependencies
//___________________
const express = require('express');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session')
const app = express();
const db = mongoose.connection;
require('dotenv').config()
//___________________
//Port
//___________________
// Allow use of Heroku's port or your own local port, depending on the environment
const PORT = process.env.PORT || 3000;

//___________________
//Database
//___________________
// How to connect to the database either via heroku or locally
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/' + `stravaUsers`;

// Connect to Mongo
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// Error / success
db.on('error', (err) => console.log(err.message + ' is Mongod not running?'));
db.on('connected', () => console.log('mongo connected: ', MONGODB_URI));
db.on('disconnected', () => console.log('mongo disconnected'));

// open the connection to mongo
db.on('open', () => { });

//___________________
//Middleware
//___________________

//use public folder for static assets
app.use(express.static('public'));

// populates req.body with parsed info from forms - if no data from forms will return an empty object {}
app.use(express.urlencoded({ extended: false }));// extended: false - does not allow nested objects in query strings
app.use(express.json());// returns middleware that only parses JSON - may or may not need it depending on your project

//use method override
app.use(methodOverride('_method'));// allow POST, PUT and DELETE from a form

//for using CSS in public folder
app.use(express.static('public')); //tells express to try to match requests with files in the directory called 'public' for CSS files

//for saving sessions and their variables in express
app.use(
    session({
        resave: false, // default more info: https://www.npmjs.com/package/express-session#resave
        saveUninitialized: false, // default  more info: https://www.npmjs.com/package/express-session#resave
        secret: process.env.CLIENT_SECRET, //must be set otherwise warnings will show up
    })
)

//___________________
// Routes
//___________________
//localhost:3000
// app.get('/' , (req, res) => {
//   res.send('Hello World!');
// });

//separate all routes into a separate file and use that
const routeController = require('./controllers/router.js');
app.use(routeController);

//___________________
//Listener
//___________________
app.listen(PORT, () => console.log('Listening on port:', PORT));