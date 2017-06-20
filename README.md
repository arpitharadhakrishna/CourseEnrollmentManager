COURSE ENROLLMENT MANAGER API
--------------------------
************************************************************************************************************************

TECHNOLOGIES USED
-----------------

This project was built using the following technologies:

1) NodeJS Server for hosting 
2) ExpressJS for REST api
3) MySQL as database
4) nodemon utility to monitor changes in code and automatically restart server.

-----------------------------------------------------------------------------------------------------------------------

TEST CASES
----------
The postman link covering all test cases:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/f344824bc184c6313273)

-----------------------------------------------------------------------------------------------------------------------
DATABASE SCHEMA
---------------

COURSE table:
-------------
course_key | varchar(50) | (Primary Key)
limit |int

STUDENT table:
--------------
id | varchar(50) | (Primary Key)
limit |int

ENROLL table:
-------------
id| int | (Primary Key)
course_key | varchar(50) (Foreign Key(COURSE))  
student_name | varchar(50) (Foreign Key(STUDENT))

WAITLIST table:
---------------
id| int | (Primary Key)
course_key | varchar(50) (Foreign Key(COURSE))  
student_name | varchar(50) (Foreign Key(STUDENT))



---------------------------------------------------------------------------------------------------------------------------

WORKFLOW
--------

1)POST: localhost:8000/courses?key=XYZ&limit=123

***inserts into course table

2)POST: localhost:8000/students?id=XYZ&limit=123

***inserts into student table

3)POST: localhost:8000/students/XYZ/enroll?course_key=XYZ

***if the student is already enrolled
***if the course has seats left
***if the student has limit
******if student has not already enrolled and student has limit and course has seats
********* insert into enroll table
********* update the course limit in course table
********* update the student limit in student table
******else student has not already enrolled and student has limit and course doesn't have seats
********* insert into waitlist table
********* update the course limit in course table
********* update the student limit in student table
***else cannot enroll

4)POST: localhost:8000/students/XYZ/drop?course_key=XYZ

***if the student has enrolled
****** delete the student from the enroll table
****** update the course limit in course table
****** update the student limit in student table
***else student cannot be dropped
***if the waitlist table and get the first student to be in waitlist table if exists
***if the course has seats left
***if the student has limit
******if student has limit and course has seats
********* insert into enroll table
********* update the course limit in course table
***else cannot enroll from waitlist, no students in waitlist for that course 


5)GET: localhost:8000/students

***select union of enroll and waitlist and group by students


---------------------------------------------------------------------------------------------------------------------------
SETUP REQUIREMENTS
------------

1) Nodejs server with npm
2) MySQL database 
3) CYGWIN (optional)
4) Postman or JSFiddler

---------------------------------------------------------------------------------------------------------------------------

SETUP INSTRUCTIONS
------------------

1) Set up database using instructions from "..\ReadMe--DataBaseSetup.md"
2) Set up nodejs using instructions from "..\ReadMe--NodejsServer.md"
---------------------------------------------------------------------------------------------------------------------------

REFERENCES
----------

1) https://medium.freecodecamp.com/building-a-simple-node-js-api-in-under-30-minutes-a07ea9e390d2
2) https://hackernoon.com/setting-up-node-js-with-a-database-part-1-3f2461bdd77f

NOTE:
-----
*** you can see output in the server console, as well as the response body.***


****************************************************************************************************************************
____________________________________________________________________________________________________________________________
