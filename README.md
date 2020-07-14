# [Run Analyzer](https://runanalyzer.herokuapp.com/) Read Me


### Technologies Used
* HTML website
* CSS styling and animations
* Node.js
* Express.js, Express-Sessions
* EJS (Embedded JavaScript Templates), EJS Partials
* MongoDB and Mongoose
* Heroku Cloud Platform for Live Site
* jQuery and vanilla JavaScript
* Axios requests to pull external data from Strava API
* Dotenv environment variables
* Document Object Model (DOM) manipulation 
* Event listeners and handlers


### Instructions
[Click here for live Run Analyzer website](https://runanalyzer.herokuapp.com/)

1. #### Authentication
    * Login to your personal Strava account if you aren't already
    * Authorize this site to view all of your activity and account data. Note all fields must be checked to work properly
    
2. #### Pull Data
    * If it is your first time logging in to this site, click 'Refresh All Data' to pull the data for all of your activities
    * If you have just added a new activity recently, click 'Refresh All Data' to pull the latest activity data from your account

3. #### View Activity
    * Click on an activity's name from the user overview page listing all activities to view more details about it
      * Click 'Edit Custom Note' to add or change a custom note about your activity that will be stored in this site
      * Switch tabs to view the activity's data in either Metric or Imperial units
      * View activity in Strava by clicking on the button in the navigation bar. Also works in User Overview page to display the current user profile in Strava

4. #### Delete Data
    * Scroll to bottom of User Overview page and click 'Delete All Data' to delete all of your data from this site, deauthorize this site's access to your Strava data, and logout


### Approach Taken
General code flow is similar to the instructions for using the website. First authorize the user's account in order to use Strava's API. Then all other methods can be run by passing in the validated token.


### Unsolved Problems
* Recursively pull all activities if more than 30 exist


### Future Features & Improvements
* Provide a much more detailed analysis of all data with various different insights and metrics
* Ability to view map of activity
* Add weather API to automatically view and save weather data for the time and place where the activity occurred 
* Integrate Last.FM or Spotify to import songs that were played during each activity, and view metrics for performance during that song's duration


##### Author/Developer: [Senthil Kannan](https://www.linkedin.com/in/spk2dc)

##### Last Updated: 7/14/2020
<!-- 
Source: https://guides.github.com/features/mastering-markdown/ 
-->
