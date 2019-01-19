const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Wubba lubba dub dub'],

  maxAge: 24 * 60 * 60 * 1000
}));
app.set('view engine', 'ejs');

// hardcoded dummy database
const urlDatabase = {
  
  'b2xVn2': {
    user: 'A10000',
    long: 'http://www.lighthouselabs.ca',
    dateCreated: 'January 12 2018',
    numClicks: 4,
    uniqueClicks: 2,
    uniqueUsers: ['B10000', 'D1111'],
    visits: [{uniqueID: 'B10000', timestamp: 'January 15 2018'}, {uniqueID: 'B10000', timestamp: 'January 23 2018'},
      {uniqueID: 'D11111', timestamp: 'June 1 2018'}, {uniqueID: 'D11111', timestamp: 'July 5 2018'}]
  },
  '9sm5xK': {
    user: 'A10000',
    long: 'http://www.google.com',
    dateCreated: 'December 31 2012',
    numClicks: 3,
    uniqueClicks: 2,
    uniqueUsers: ['B10000', 'C22222'],
    visits: [{uniqueID: 'B10000', timestamp: 'September 25 2013'}, {uniqueID: 'C22222', timestamp: 'January 23 2018'}]
  },
  '5dT232': {
    user: 'A10100',
    long: 'http://www.canucks.com',
    dateCreated: 'June 15 2015',
    numClicks: 1,
    uniqueClicks: 1,
    uniqueUsers: ['TXx777'],
    visits: [{uniqueID: 'TXx777', timestamp: 'June 25 2015'}]
  }
  
};
// generate strings for ID's
const generateRandomString  = () => {
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const numbers = [];
    
    numbers.push(Math.floor(Math.random() * 10) + 1 + 47);
    numbers.push(Math.floor(Math.random() * 26) + 1 + 64);
    numbers.push(Math.floor(Math.random() * 26) + 1 + 96);
    
    const index = Math.floor(Math.random() * 3);
    randomString += String.fromCharCode(numbers[index]);
  }
  return randomString;
};

// get all URLS attributed to a single user
const urlsForUser = (id) => {
  userURLs = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].user === id) {
      userURLs[key] = urlDatabase[key];
    }
  }
  return userURLs;
};

// validate html format for long URLs
const linkChecker = (link) => {
  const httpRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
  if (!httpRegex.test(link)) {
    return false;
  }
  return true;
};

// validate email format for login / registration
const validateEmail = (email) => {
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(!emailRegex.test(email)) {
    return false;
  }
  return true;
};

// months array for dateCreated property of shortened link
const months = ['January', 'February', 'March', 'Aprrl', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// get date and parse to readable format
const getDate = () => {
  const date = JSON.stringify(new Date());
  const year = date.slice(1, 5);
  const month = Number(date.slice(6, 8));
  const day = date.slice(9, 11);
  return `${months[month]} ${day} ${year}`;
};

// passwords for hardcoded dummy users
const firstPass = bcrypt.hashSync('first', 10);
const secondPass = bcrypt.hashSync('second', 10);

// hardcoded dummy users
const users = {
  A10000: {
    id: 'A10000',
    email: 'first@gmail.com',
    password: ''
  },
  A10100: {
    id: 'A10100',
    email: 'second@gmail.com',
    password: ''
  }
};

// set passwords for dummy users
users.A10000.password = firstPass;
users.A10100.password = secondPass;

/**************************

          Root

**************************/

app.get('/', (req, res) => {
  res.redirect('/urls');
});

/**************************

Registration / Login Routes

**************************/

app.get('/register', (req, res) => {
  const id = req.session.user_Id;
  let templateVars = {user: users[id], registerError: req.registerError};
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const {email, pass} = req.body;
  // flag set to false for if a user email already exists in the db
  let existsFlag = 0;
  for (key in users) {
    if (users[key].email === email) {
      //set flag to true if email is found
      existsFlag = 1;
    }
  }
  // send user back to registration page with error message if email is invalid format
  if (!validateEmail(email)) {
    req.registerError = 'invalid email format';
    templateVars = {user: users[id], registerError: req.registerError};
    res.render('register', templateVars);
  } else {
    // send user back to registration page with error message if user email already exists
    if (existsFlag) {
      req.registerError = 'user email already exists';
      let templateVars = {user: users[id], registerError: req.registerError};
      res.render('register', templateVars);
    } else {
      req.registerError = undefined;
      users[id] = {};
      users[id].id = id;
      users[id].email = email;
      users[id].password = bcrypt.hashSync(pass, 10);
      
      req.session.user_Id = id;
      res.redirect('/urls');
    }
  }
});

app.get('/login', (req, res) => {
  const id = req.session.user_Id;
  let templateVars = {user: users[id], emailError: req.emailError};
  res.render('login', templateVars);

});

app.post('/login', (req, res) => {
  const { email, pass} = req.body;
  let id;
  // send user back to login page with error message if email is invalid format
  if (!validateEmail(email)) {
    req.emailError = 'invalid email format';
    templateVars = {user: users[id], emailError: req.emailError};
    res.render('login', templateVars);
  } else {

    for (key in users) {
      if (users[key].email === email && bcrypt.compareSync(pass, users[key].password)) {
        id = users[key].id;
      }
    }
    if (id === undefined) {
      res.status(403);
      res.send('Invalid Login');
    }
    req.session.user_Id = id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/**************************

  View Render Routes

**************************/

app.get('/urls', (req, res) => {
  req.linkError = undefined;
  const id = req.session.user_Id;
  const urls = urlsForUser(id);
  let templateVars = { urls, user: users[id]};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.session.user_Id;
  const linkError = req.linkError;
  if ( id === undefined) {
    res.redirect('/login');
  } else {
    let templateVars = { user: users[id], linkError };
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:id', (req, res) => {
  let {id} = req.params;
  const linkError = req.linkError;
  const userId = req.session.user_Id;
  const url = urlDatabase[id].long;
  let templateVars = { shortURL: req.params.id, url, user: users[userId], visits: urlDatabase[req.params.id].visits, linkError };
  res.render('urls_show', templateVars);
});

/**************************

  Operation Routes

**************************/

app.put('/urls/:id', (req, res) => {
  const userId = req.session.user_Id;
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const url = urlDatabase[shortURL].long;
  // send unauthorized status if page accessed without login
  if(!userId) {
    res.status(403).send('Unauthorized');
  } else {
    // send user back to edit page with error message if url is invalid format
    if (!linkChecker(newLongURL)) {
      req.linkError = 'invalid link did you forget http:// ?';
      templateVars = {shortURL, user: users[userId], url, visits: urlDatabase[shortURL].visits, linkError: req.linkError};
      res.render('urls_show', templateVars);
    } else {
      req.linkError = undefined;
    
      if (urlDatabase[shortURL].user === userId) {
        urlDatabase[shortURL].long = newLongURL;
      }
      res.redirect('/urls');
    }
  }
});

app.post('/urls', (req, res) => {
  const id = req.session.user_Id;
  const newId = generateRandomString();
  const {longURL} = req.body;
  // send unauthorized status if page accessed without login
  if(!id) {
    res.status(403).send('Unauthorized');
  }else {
    // send user back to new url page with error message if link invalid format
    if (!linkChecker(longURL)) {
      req.linkError = 'invalid link did you forget http:// ?';
      templateVars = {user: users[id], linkError: req.linkError};
      res.render('urls_new', templateVars);
    } else {
      req.linkError = undefined;
      parsedDate = getDate();
      urlDatabase[newId] = {
        user: id,
        long: longURL,
        dateCreated: parsedDate,
        numClicks: 0,
        uniqueClicks: 0,
        uniqueUsers: [],
        visits: []
      };
      res.redirect('/urls');
    }
  }
});

app.delete('/urls/:id/delete', (req, res) => {
  id = req.session.user_Id;
  const shortURL = req.params.id;
  // send unauthorized status if page accessed without login
  if(!id) {
    res.status(403).send('Unauthorized');
  } else {
    if (urlDatabase[shortURL].user === id) {
      delete urlDatabase[shortURL];
    }
    res.redirect('/urls');
  }
});

/**************************

  Redirect to URL Route

**************************/

app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = req.params;
  const longURL = urlDatabase[shortURL].long;
  const uniqueID = generateRandomString();
  if (req.session.uniqueID === undefined) {
    req.session.uniqueID = uniqueID;
    urlDatabase[shortURL].uniqueUsers.push(req.session.uniqueID);
    urlDatabase[shortURL].uniqueClicks++;
  } else if (!urlDatabase[shortURL].uniqueUsers.includes(req.session.uniqueID)) {
    urlDatabase[shortURL].uniqueClicks++;
    urlDatabase[shortURL].uniqueUsers.push(req.session.uniqueID);
  }
  const timestamp = getDate();
  urlDatabase[shortURL].visits.push({uniqueID: req.session.uniqueID, timestamp});
  urlDatabase[shortURL].numClicks++;
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});