var mongoose = require('mongoose');

var Schema = mongoose.Schema;

GradeSchema = new Schema({
  date: Date,
  grade: String,
  score: Number
});

RestaurantSchema = new Schema({
  address: {
    building: String,
    coord: [Number],
    street: String,
    zipcode: String
  },
  borough: String,
  cuisine: String,
  grades: [GradeSchema],
  name: String,
  restaurant_id: String
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);