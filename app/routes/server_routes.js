module.exports = function(app, connection) {
//insert courses into course table
    app.post('/courses', (req, res) => {
      var value = { course_key: req.body.key, lim: req.body.limit};
      connection.query("INSERT INTO course SET ?",value,function(err,rows,fields){
         if(err){
           res.send(err);
         }else{
           res.send("Inserted course into database");
         }
      });
    });
// insert students into student table
    app.post('/students', (req, res) => {
       var value = { id: req.body.id, lim: req.body.limit};
       connection.query("INSERT INTO student SET ?",value,function(err,rows,fields){
           if(err){
             res.send(err);
           }
           else{
             res.send("Inserted student into database");
           }
       });
    });
//enroll students or waitlist them
    app.post('/students/:student_id/enroll', (req, res) => {
         var course_key = req.body.course_key;
         var student_name = req.params.student_id;

        // Promises to check if student has not already enrolled into same course, if course has seats left, and if student has not reached his/her limit
         var p1 = student_has_enrolled(course_key,student_name);
         var p2 = course_has_seats(course_key);
         var p3 = student_has_limit(student_name);
         // resolve the three promises asynchronously
         Promise.all([p1,p2,p3]).then( values =>{
            var course_seat = values[1][0].lim;
            var student_limit = values[2][0].lim;
            //if there are seats in the course and student has not reached limit enroll them
            if(course_seat > 0 && student_limit > 0){
              //enroll student
              enroll_student(course_key,student_name,course_seat,student_limit);
              res.send("Student is Enrolled");
            }else if(course_seat == 0 && student_limit > 0){ // if there are no seats left but student has not yet reached his limit waitlist them
                   //check if student has aready been waitlisted
                   student_has_been_waitlisted(course_key,student_name).then( values =>{
                       //student has not already been waitlisted, so waitlist them
                       waitlist_student(course_key, student_name,student_limit);
                       res.send("Student has been waitListed");
                   }).catch((error) => {
                      res.send("Student already waitlisted");
                   });
              }else{
                 res.send("Student has passed the limit");
              }
          }).catch((error) => {
              console.log(error + ' cannot enroll');
              res.send(error+" Cannot enroll");
          });

    });
//drop student from course and enroll the first student waitlisted for the course if it exists
    app.post('/students/:student_id/drop', (req, res) => {
             var course_key = req.body.course_key;
             var student_name = req.params.student_id; //student to dropped

             //Promises to find if the student is enrolled(if not, you cannot drop them),
             //find students limit to update the student table after dropping student from course,
             //find course seat number to update the course table after dropping student from course

             var p1 = course_has_seats(course_key);
             var p2 = student_has_limit(student_name);
             var p3 = has_student_enrolled(course_key,student_name);

             Promise.all([p1,p2,p3]).then( (values) => {
                  return [values[0][0].lim ,values[1][0].lim];
             }).then((data) => {
                   var course_seat = data[0] ;
                   var student_limit = data[1];
                   //drop the student from table, increment student limit and course seat
                   return drop_student(course_key,student_name,course_seat,student_limit);
             }).then(()=>{
                 // check the waitlist table for the first student to be enrolled if present
                 return waitlist_for_course(course_key);
             }).then((value)=>{
                var student_id = value[0].student_name;
                var waitlist_id = value[0].id;
                var p4 = course_has_seats(course_key);
                var p5 = student_has_limit(student_name);
                //get the new course seat limit, student enrollment limit
                Promise.all([p4,p5]).then( (data) => {
                   //enroll the new student
                    enroll_student(course_key,student_id,data[0][0].lim,data[1][0].lim);
                   //remove student
                    remove_from_waitlist(waitlist_id);
                }).catch((error) => {
                    return error;
                })
                 res.send("Student dropped from course");
             }).catch((error) => {
                   res.send("Cannot drop the course, error occured "+error);
             });
    });

    app.get('/students', (req, res) => {
         connection.query("SELECT * FROM ((SELECT course_key,student_name, 'Waitlisted' as stat from waitlist) union (select course_key,student_name,'Enrolled' as stat from enroll)) tt",function(err,rows,fields){
                if(err){
                   res.send(err);
                }else{
                   var result = new Map();
                   for(var i= 0; i < rows.length;i++){
                      if(result.get(rows[i].student_name) == null){
                        var arr = [];
                        arr[0] = { [rows[i].course_key] : rows[i].stat};
                        result.set(rows[i].student_name,arr);
                      }else{
                        var array = result.get(rows[i].student_name);
                        console.log(array);
                        array.push({ [rows[i].course_key] : rows[i].stat});
                        result.set(rows[i].student_name,array);
                      }
                   }
                   res.send(mapToJson(result));
                }
         });
    });

// HELPER functions
   function mapToJson(map) {
       return JSON.stringify([...map]);
   }

    function waitlist_for_course(course_key){
       return new Promise(function(resolve, reject) {
       //id is primary key and is auto incremented, by that logic student with the minimum id, who is waitlisted for the course is selected
       connection.query("SELECT  w.student_name,w.id FROM waitlist w WHERE w.id = (SELECT MIN(wl.id) FROM waitlist wl) AND w.course_key = ?",course_key,function(err,rows,fields){
             if(err){
                reject(err);
             }else{
                if(rows.Length == 0){
                  reject("No one in wait list");
                }else{
                   resolve(rows);
                }
             }
           });
        });
    }

    function remove_from_waitlist(id){
     connection.query("DELETE FROM waitlist WHERE id = ?",id,function(err,rows,fields){
          if(err){
            console.log(err);
          }
     });
    }

    function enroll_student(course_key,student_name,course_seat,student_limit){
         var val = [ course_key, student_name ];
         connection.query("INSERT INTO enroll(course_key,student_name) VALUES(?)",[val],function(err,rows,fields){
                          if(err){
                             return console.log(err);
                          }else{
                             console.log("Enrolled into the course "+rows);
                          }
         });
         connection.query("UPDATE course SET lim = ? WHERE course_key = ?",[course_seat - 1 , course_key],function(err,rows,fields){
                          if(err){
                            return console.log(err);
                          }else{
                             console.log("Update the Course table "+rows);
                          }
          });
          connection.query("UPDATE student SET lim = ? WHERE id = ?",[student_limit - 1 , student_name],function(err,rows,fields){
                          if(err){
                             return console.log(err);
                          }else{
                            console.log("Update the Course table "+rows);
                          }
          });
   }

   function drop_student(course_key,student_name,course_seat,student_limit){
         var val = [ course_key, student_name ];
         connection.query("DELETE FROM enroll WHERE course_key = ? AND student_name = ?",val,function(err,rows,fields){
                    if(err){
                         console.log(err);
                    }else{
                         console.log("Deleted in the Enroll table "+rows);
                    }
         });
         connection.query("UPDATE course SET lim = ? WHERE course_key = ?",[course_seat + 1 , course_key],function(err,rows,fields){
                     if(err){
                         console.log(err);
                     }else{
                         console.log("Update the Course table "+ rows);
                     }
          });
          connection.query("UPDATE student SET lim = ? WHERE id = ?",[student_limit + 1 , student_name],function(err,rows,fields){
                     if(err){
                        console.log(err);
                     }else{
                         console.log("Update the Student table "+ rows);
                     }
          });
  }

  function waitlist_student(course_key, student_name,student_limit){
        var val = [ course_key, student_name ];
         connection.query("INSERT INTO waitlist(course_key,student_name) VALUES(?)",[val],function(err,rows,fields){
                if(err){
                  return  console.log(err);
                }else{
                  console.log(rows);
                }
         });
         connection.query("UPDATE student SET lim = ? WHERE id = ?",[student_limit - 1 , student_name],function(err,rows,fields){
            if(err){
                     return  console.log(err);
                 }else{
                     console.log(rows);
                 }
         });

    }

    function student_has_enrolled(course_key,student_name){
      return new Promise(function(resolve, reject) { connection.query("SELECT  * FROM enroll WHERE course_key = ? AND student_name = ?",[course_key,student_name],function(err,rows,fields){
            if(err){
                reject(err);
             }else{
                if(rows.length > 0){
                   reject("Student already enrolled");
                }else{
                    resolve(rows);
                }
            }
         });
      });
    }

    function has_student_enrolled(course_key,student_name){
         return new Promise(function(resolve, reject) { connection.query("SELECT  * FROM enroll WHERE course_key = ? AND student_name = ?",[course_key,student_name],function(err,rows,fields){
               if(err){
                   reject(err);
                }else{
                   if(rows.length > 0){
                      resolve(rows);
                   }else{
                      reject("Student is not enrolled");
                   }
               }
            });
         });
    }

    function student_has_been_waitlisted(course_key,student_name){
      var value = [course_key,student_name];
          return new Promise(function(resolve, reject) { connection.query("SELECT  * FROM waitlist WHERE course_key = ? AND student_name = ?",value,function(err,rows,fields){
                if(err){
                    reject(err);
                 }else{
                    if(rows.length > 0){
                       reject("Student has already been waitlisted ");
                    }else{
                        resolve(rows);
                    }
                }
             });
          });
    }

    function course_has_seats(value){
      return new Promise(function(resolve, reject){ connection.query("SELECT c.lim FROM course c WHERE c.course_key = ?",value,function(err,row,fields){
            if(err){
              reject(err);
            }else{
                resolve(row);
            }
        });
      });
    }

    function student_has_limit(value){
          return new Promise(function(resolve, reject){
           connection.query("SELECT s.lim FROM student s WHERE s.id = ?",value,function(err,row,fields){
                if(err){
                  console.log(err);
                  reject(err);
                }else{
                    resolve(row);
                }
            });
       })
    }


};