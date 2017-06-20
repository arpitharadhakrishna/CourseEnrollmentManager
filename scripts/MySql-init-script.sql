create database course_manager;

create table course_manager.student (
  id varchar(50) not null primary key,
  lim INT
);

create table course_manager.course (
  course_key varchar(50) not null primary key,
  lim INT
);
