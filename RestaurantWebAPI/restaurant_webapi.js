var mongoose = require('mongoose');
const { count } = require('./models/restaurant');
var Restaurant = require('./models/restaurant');

async function getCountOfRecords(filterCriteria) {
  let count = 0;
  try {
    count = Restaurant.count(filterCriteria);
  } catch (e) {
  }

  return count;
}

exports.restaurant_webapi =
{
  initialize: function(connection_string) {
    return [mongoose.connect(connection_string), Restaurant];
  },

  getAllRestaurants: function(page, perPage, borough, cuisine) {
    let skipNumber = perPage * (page - 1);
    let limitNumber = perPage;

    if ((borough) && (cuisine)) {
      let findGCuisinerep = new RegExp(`${cuisine}`, 'i');
      let findGBoroughrep = new RegExp(`${borough}`, 'i');
      let count = getCountOfRecords({ 'borough': findGBoroughrep, 'cuisine':  findGCuisinerep });
      return [Restaurant.find({ 'borough': findGBoroughrep, 'cuisine':  findGCuisinerep }).sort('restaurant_id').skip(skipNumber).limit(limitNumber), count];
    } else if (cuisine) {
      let findGCuisinerep = new RegExp(`${cuisine}`, 'i');
      let count = getCountOfRecords({ 'cuisine': findGCuisinerep });
      return [Restaurant.find({ 'cuisine': findGCuisinerep }).sort('restaurant_id').skip(skipNumber).limit(limitNumber), count];
    } else if (borough) {
      let findGBoroughrep = new RegExp(`${borough}`, 'i');
      let count = getCountOfRecords({ 'borough': findGBoroughrep });
      return [Restaurant.find({ 'borough': findGBoroughrep }).sort('restaurant_id').skip(skipNumber).limit(limitNumber), count];
    } else {
      let count = getCountOfRecords({});
      return [Restaurant.find({}).sort('restaurant_id').skip(skipNumber).limit(limitNumber), count];
    }
  },

  addNewRestaurant: function(restaurant) {
    return Restaurant.create(restaurant);
  },

  getRestaurantById: function(id) {
    return Restaurant.findById(id);
  },

  updateRestaurantById: function(id, restaurant) {
    return Restaurant.findByIdAndUpdate(id, restaurant);
  },

  deleteRestaurantById: function(id) {
    return Restaurant.deleteOne({ _id: id });
  },
}