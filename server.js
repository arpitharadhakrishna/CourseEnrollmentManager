const express        = require('express');
const bodyParser     = require('body-parser');
const app            = express();
const mysql = require('mysql');
const connection = mysql.createConnection({ // Mysql Connection
               host : '127.0.0.1',
               user : 'root',
               password : 'Enter_your_Password_Here',
               database : 'course_manager',
           });

const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));

require('./app/routes')(app, connection);
 app.listen(port, () => {
   console.log('We are live on ' + port);
 });