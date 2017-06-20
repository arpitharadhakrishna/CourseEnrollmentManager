create table course_manager.enroll (
  id int auto_increment not null primary key,
  course_key varchar(50),
  student_name varchar(50),
  foreign key (course_key) references course_manager.course(course_key),
  foreign key (student_name) references student(id)
);

create table course_manager.waitlist (
  id int auto_increment not null primary key,
  course_key varchar(50),
  student_name varchar(50),
  foreign key (course_key) references course_manager.course(course_key),
  foreign key (student_name) references student(id)
);
