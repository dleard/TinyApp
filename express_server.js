const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Wubba lubba dub dub'],

  maxAge: 24 * 60 * 60 * 1000
}));
app.set('view engine', 'ejs');

const urlDatabase = {
  
  'b2xVn2': {
    user: 'A10000',
    long: 'http://www.lighthouselabs.ca',
    dateCreated: '12 January 2018'
  },
  '9sm5xK': {
    user: 'A10000',
    long: 'http://www.google.com',
    dateCreated: '31 December 2012'
  },
  '5dT232': {
    user: 'A10100',
    long: 'http://www.canucks.com',
    dateCreated: '15 June 2015'
  }
  
};

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

const urlsForUser = (id) => {
  userURLs = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].user === id) {
      userURLs[key] = urlDatabase[key];
    }
  }
  return userURLs;
};

const linkChecker = (link) => {
  const httpRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
  if (!httpRegex.test(link)) {
    return false;
  }
  return true;
};

const validateEmail = (email) => {
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(!emailRegex.test(email)) {
    return false;
  }
  return true;
};

const firstPass = bcrypt.hashSync('first', 10);
const secondPass = bcrypt.hashSync('second', 10);

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

users.A10000.password = firstPass;
users.A10100.password = secondPass;

const months = ['January', 'February', 'March', 'Aprrl', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.session.user_Id;
  let templateVars = {user: users[id], duplicateUserError: req.duplicateUserError};
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const {email, pass} = req.body;
  let existsFlag = 0;
  for (key in users) {
    if (users[key].email === email) {
      existsFlag = 1;
    }
  }
  if (existsFlag) {
    req.duplicateUserError = 'user email already exists';
    let templateVars = {user: users[id], duplicateUserError: req.duplicateUserError};
    res.render('register', templateVars);
  } else {
    req.duplicateUserError = undefined;
    users[id] = {};
    users[id].id = id;
    users[id].email = email;
    users[id].password = bcrypt.hashSync(pass, 10);
    
    req.session.user_Id = id;
    res.redirect('/urls');
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
  }
  let templateVars = { user: users[id], linkError };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  let {id} = req.params;
  const linkError = req.linkError;
  const userId = req.session.user_Id;
  const url = urlDatabase[id].long;
  let templateVars = { shortURL: req.params.id, url, user: users[userId], linkError };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const id = req.session.user_Id;
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const url = urlDatabase[shortURL].long;
  if(!id) {
    res.status(403).send('Unauthorized');
  } else {
    if (!linkChecker(newLongURL)) {
      req.linkError = 'invalid link did you forget http:// ?';
      templateVars = {shortURL, user: users[id], url, linkError: req.linkError};
      res.render('urls_show', templateVars);
    } else {
      req.linkError = undefined;
    
      if (urlDatabase[shortURL].user === id) {
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
  if(!id) {
    res.status(403).send('Unauthorized');
  }else {
    if (!linkChecker(longURL)) {
      req.linkError = 'invalid link did you forget http:// ?';
      templateVars = {user: users[id], linkError: req.linkError};
      res.render('urls_new', templateVars);
    } else {
      req.linkError = undefined;
      const date = JSON.stringify(new Date());
      const year = date.slice(1, 5);
      const month = Number(date.slice(6, 8));
      const day = date.slice(9, 11);
      const parsedDate = `${day} ${months[month]} ${year}`;
      urlDatabase[newId] = {
        user: id,
        long: longURL,
        dateCreated: parsedDate
      };
      res.redirect('/urls');
    }
  }
});

app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = (req.params);
  const longURL = urlDatabase[shortURL].long;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  id = req.session.user_Id;
  const shortURL = req.params.id;
  if(!id) {
    res.status(403).send('Unauthorized');
  } else {
    if (urlDatabase[shortURL].user === id) {
      delete urlDatabase[shortURL];
    }
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});