/*********************************************************************************************
* ITE5315 – Project - Group Project (Ved Chandurkar + Zafer Kalafat)
* We declare that this project is our own work in accordance with Humber Academic Policy. 
* No part of this project has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
* 
* Name: Ved Chandurkar + Zafer Kalafat  Student ID: n01436129 + n01468413  Date: 9 April 2022
*********************************************************************************************/
var path = require('path');
var express = require('express');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken')
const { celebrate, Joi, errors, Segments } = require('celebrate');
require('dotenv').config()

var app = express();

var database_restaurant_atlas = require('./config/database_atlas'); // Remote Atlas Database
// var database_restaurant_local = require('./config/database'); // Local MongoDB
var bodyParser = require('body-parser');

var port = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ 'extended': 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.static(path.join(__dirname, 'public')));
app.engine('.hbs', exphbs.engine(
  {
    extname: '.hbs',
    layoutsDir: 'views/layouts',
    partialsDir: 'views/partials',
    defaultLayout: 'main',
    helpers: {
      'getGradesAsString': function(grades) {
        let itemStr = '';
        if (grades) {
          for (let i = 0; i < grades.length; i++) {
            let item = grades[i];
            let dt = new Date(item._doc.date);
            let itemOne = dt.getFullYear() + '/' + (dt.getUTCMonth() + 1) + '/' + dt.getUTCDate() +
              ", " + item._doc.grade + ", " + item._doc.score;
            if (i == grades.length - 1) {
              if (item != '') itemStr += itemOne;
            } else {
              if (item != '') itemStr += itemOne + '; ';
            }
          }
        }

        return itemStr;
      },
      'getArrayDateItemsAsString': function(arr, nameIndex) {
        if (arr && arr.length > 0) {
          let itemStr = '';
          for (let i = 0; i < arr.length; i++) {
            let dt = new Date(arr[i]._doc[nameIndex]);
            let dtStr = dt.getFullYear() + '/' + (dt.getUTCMonth() + 1) + '/' + dt.getUTCDate();
            if (i == arr.length - 1) {
              if (dt != '') itemStr += dtStr;
            } else {
              if (dt != '') itemStr += dtStr + '<hr>';
            }
          }
          return itemStr;
        } else {
          return '';
        }
      },
      'getArrayItemsAsStringForIndex': function(arr, nameIndex) {
        if (arr && arr.length > 0) {
          let itemStr = '';
          for (let i = 0; i < arr.length; i++) {
            let item = arr[i]._doc[nameIndex];
            if (i == arr.length - 1) {
              if (item != '') itemStr += item;
            } else {
              if (item != '') itemStr += item + '<hr>';
            }
          }
          return itemStr;
        } else {
          return '';
        }
      },
      'getDateFromDateTime': function(dateTime) {
        if (dateTime) {
          let dt = new Date(dateTime);
          return dt.getFullYear() + '/' + (dt.getUTCMonth() + 1) + '/' + dt.getUTCDate();
        } else {
          return 'N/A';
        }
      },
      'getArrayItemsAsString': function(arr) {
        if (arr && arr.length > 0) {
          let itemStr = '';
          for (let i = 0; i < arr.length; i++) {
            let item = parseFloat(arr[i]);
            if (i == arr.length - 1) {
              if (arr[i] != '') itemStr += Math.floor(item * 10000) / 10000;
            } else {
              if (arr[i] != '') itemStr += Math.floor(item * 10000) / 10000 + '<hr>';
            }
          }
          return itemStr;
        } else {
          return '';
        }
      },
      'getFirst': function(len, str) {
        if (str) {
          if (str.length > len) {
            return str.substr(0, len) + ' ... ';
          } else {
            return str;
          }
        } else {
          return '';
        }
      },
      'getEmptyTotalCountMessage': function(totalCount, message) {
        if (totalCount > 0) {
          return '';
        } else {
          return '<tr><td colspan="13" style="font-size: 22px;">' + message + '</td></tr>';
        }
      },
    }
  }
));

app.set('view engine', 'hbs');

var { restaurant_webapi } = require('./restaurant_webapi');

async function initialize() {
  var promise, model;
  try {
    [promise, model] = restaurant_webapi.initialize(database_restaurant_atlas.url);
    await promise;
  } catch (err) {
    console.log(`Could not connect to atlas server, error: ${err}'`);
  }
}

initialize();

//---------------------------------------------------------------------------
// Verify login
function verifyAccess(token) {
  // const token = req.headers['accesstoken'];
  if (!token) return false;

  if (process.env.ALLOW_DUMMY_TOKEN == 'true') {
    return true;
  } else {
    try {
      const decoded = jwt.verify(token, process.env.CRYPTO_TOKEN);
      if (decoded == process.env.VALIDATE_PASSPHRASE) {
        return true;
      }
    } catch (e) {
      console.log(e);
    }

    return false;
  }
}

//---------------------------------------------------------------------------
// User Login
app.post('/api/login', (req, res) => {
  let password = req.body.password;
  if (password == process.env.PASSWORD) {
    var accessToken;
    if (process.env.ALLOW_DUMMY_TOKEN == 'true') { // For Heroku this is safer, we do not want to expose our token inadverdently
      accessToken = process.env.DUMMY_TOKEN;
    } else {
      accessToken = jwt.sign(process.env.VALIDATE_PASSPHRASE, process.env.CRYPTO_TOKEN)
    }
    res.status(200).json({ accessToken: accessToken }) // Send back user access token
  } else {
    res.status(401).json({ error: 'invalid login' }) // Send back user access token
  }
});

//---------------------------------------------------------------------------
// Get all restaurants from database
app.get('/api/restaurants', celebrate({
  [Segments.QUERY]: {
    page: Joi.number().integer().min(1).required().messages({
      "number.required": 'page query parameter is required',
      'number.min': 'page query parameter must be >= 1',
      'number.base': 'page query parameter must be an number'
    }),
    perPage: Joi.number().integer().min(1).required().messages({
      "number.required": 'perPage query parameter is required',
      'number.min': 'perPage query parameter must be >= 1',
      'number.base': 'perPage query parameter must be an number'
    }),
    borough: Joi.string(),
    cuisine: Joi.string(),
    accessToken: Joi.string()
  }
}), async function(req, res) {
  var promise, totalCountPromise, totalCount = 0;
  let restaurants = {};
  try {
    var page = req.query.page;
    var perPage = req.query.perPage;
    var borough = req.query.borough;
    var cuisine = req.query.cuisine;
    var accessToken = req.query.accessToken;
    var accessTokenOK = verifyAccess(accessToken);
    if (accessTokenOK) {
      [promise, totalCountPromise] = restaurant_webapi.getAllRestaurants(page, perPage, borough, cuisine);
      restaurants = await promise;
      totalCount = await totalCountPromise;
    }
  } catch (err) {
    return res.status(400).json(`{ success: false, error: ${err} }`);
  }

  if (accessTokenOK) {
    if (totalCount == 0) {
      res.status(200).render('index', { title: 'Project - Step 2 - 2', partialName: 'display_all_restaurants', restaurants: restaurants, page: page, perPage: perPage, borough: borough, cuisine: cuisine, totalCount: totalCount, accessToken: accessToken, message: 'No Records found!' });
    } else {
      res.status(200).render('index', { title: 'Project - Step 2 - 2', partialName: 'display_all_restaurants', restaurants: restaurants, page: page, perPage: perPage, borough: borough, cuisine: cuisine, totalCount: totalCount, accessToken: accessToken, message: '' });
    }
  } else {
    res.status(200).render('index', { title: 'Project - Step 2 - 2', partialName: 'display_all_restaurants', restaurants: restaurants, page: page, perPage: perPage, borough: borough, cuisine: cuisine, totalCount: totalCount, message: 'Please login first!' });
  }
});

//---------------------------------------------------------------------------
// Display Restaurant entry form
app.get('/api/restaurant_add', async function(req, res) {
  var accessTokenOK = verifyAccess(req.query.accessToken);
  if (accessTokenOK) {
    res.status(200).render('index', { title: 'Project - Step 2 - 1', partialName: 'add_restaurant_form', layout: 'main_display_restaurant', accessToken: req.query.accessToken });
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Create the retaurant from the post of the above form
app.post('/api/restaurant', async function(req, res) {
  let accessToken = req.body.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  let dateGradeScoreArray = [];
  if (accessTokenOK) {
    if (req.body.grades) {
      let gradesArray = req.body.grades.split(';');
      for (let i = 0; i < gradesArray.length; i++) {
        let grades = gradesArray[i].trim();
        let gradesEntryArray = grades.split(',');
        dateGradeScoreArray.push({
          date: gradesEntryArray[0].trim(),
          grade: gradesEntryArray[1].trim(),
          score: gradesEntryArray[2].trim()
        });
      }
    }

    let restaurant = {
      address: {
        building: req.body.building,
        coord: [req.body.longitude, req.body.latitude],
        street: req.body.street,
        zipcode: req.body.zipcode
      },
      borough: req.body.borough,
      cuisine: req.body.cuisine,
      grades: dateGradeScoreArray,
      name: req.body.name,
      restaurant_id: req.body.restaurant_id
    };

    try {
      await restaurant_webapi.addNewRestaurant(restaurant)
      // Now route to the the list of restaurants
      if ((req.body.borough) && (req.body.cuisine)) {
        res.status(201).redirect(`/api/restaurants?page=1&perPage=5&borough=${req.body.borough}&cuisine=${req.body.cuisine}&accessToken=${accessToken}`);
      } else if (req.body.cuisine) {
        res.status(201).redirect(`/api/restaurants?page=1&perPage=5&cuisine=${req.body.cuisine}&accessToken=${accessToken}&accessToken=${accessToken}`);
      } else if (req.body.borough) {
        res.status(201).redirect(`/api/restaurants?page=1&perPage=5&borough=${req.body.borough}&accessToken=${accessToken}`);
      } else {
        res.status(201).redirect('/api/restaurants?page=1&perPage=5&accessToken=${accessToken}');
      }
    } catch (err) {
      res.status(400).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Get a restaurant with ID of restaurant_id
app.get('/api/restaurant/:restaurant_id', async function(req, res) {
  let accessToken = req.query.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  if (accessTokenOK) {
    let restaurant = {};
    try {
      restaurant = await restaurant_webapi.getRestaurantById(req.params.restaurant_id);
      res.status(200).render('index', { title: 'Project - Step 2 - 3', partialName: 'display_one_restaurant', layout: 'main_display_restaurant', restaurant: restaurant });
    } catch (err) {
      res.status(400).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Helper route to show the update form
app.get('/api/restaurant_update/:restaurant_id', async function(req, res) {
  let accessToken = req.query.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  if (accessTokenOK) {
    let restaurant = {};
    try {
      restaurant = await restaurant_webapi.getRestaurantById(req.params.restaurant_id);
      res.status(200).render('index', { title: 'Project - Step 2 - 4', partialName: 'update_one_restaurant', layout: 'main_display_restaurant', restaurant: restaurant, accessToken: req.query.accessToken });
    } catch (err) {
      res.status(200).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Helper route to show the delete confirmation
app.get('/api/restaurant_delete/:restaurant_id', async function(req, res) {
  let accessToken = req.query.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  if (accessTokenOK) {
    let restaurant = {};
    try {
      restaurant = await restaurant_webapi.getRestaurantById(req.params.restaurant_id);
      res.status(200).render('index', { title: 'Project - Step 2 - 5', partialName: 'delete_one_restaurant', layout: 'main_display_restaurant', restaurant: restaurant, accessToken: req.query.accessToken });
    } catch (err) {
      res.status(200).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Update a restaurant with an id of <restaurant_id>
app.put('/api/restaurant/:restaurant_id', async function(req, res) {
  let accessToken = req.body.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  let dateGradeScoreArray = [];

  if (accessTokenOK) {
    if (req.body.grades) {
      let gradesArray = req.body.grades.split(';');
      for (let i = 0; i < gradesArray.length; i++) {
        let grades = gradesArray[i].trim();
        let gradesEntryArray = grades.split(',');
        dateGradeScoreArray.push({
          date: gradesEntryArray[0].trim(),
          grade: gradesEntryArray[1].trim(),
          score: gradesEntryArray[2].trim()
        });
      }
    }

    let restaurant = {
      address: {
        building: req.body.building,
        coord: [req.body.longitude, req.body.latitude],
        street: req.body.street,
        zipcode: req.body.zipcode
      },
      borough: req.body.borough,
      cuisine: req.body.cuisine,
      grades: dateGradeScoreArray,
      name: req.body.name,
      restaurant_id: req.body.restaurant_id
    };

    try {
      await restaurant_webapi.updateRestaurantById(req.params.restaurant_id, restaurant);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

//---------------------------------------------------------------------------
// Delete a restaurant by id of <restaurant_id>
app.delete('/api/restaurant/:restaurant_id', async function(req, res) {
  let accessToken = req.body.accessToken;
  var accessTokenOK = verifyAccess(accessToken);
  if (accessTokenOK) {
    try {
      await restaurant_webapi.deleteRestaurantById(req.params.restaurant_id)
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(400).json(`{ success: false, error: ${err} }`);
    }
  } else {
    res.status(401).redirect('/api/restaurants?page=1&perPage=5');
  }
});

app.use(errors());

app.listen(port);
console.log("App listening on port : " + port);