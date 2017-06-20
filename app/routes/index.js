const course_manager_routes = require('./server_routes');5
module.exports = function(app, db) {
  course_manager_routes(app, db);
};