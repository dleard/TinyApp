const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  
  'b2xVn2': {
    user: 'A10000',
    long: 'http://www.lighthouselabs.ca',
  },  
  '9sm5xK': {
    'user': 'A10000',
    long: 'http://www.google.com'
  },
  '5dT232': {
    user: 'A10100',
    long: 'http://www.canucks.com'
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
  userURLs = {}
  for (key in urlDatabase) {
    if (urlDatabase[key].user === id) {
      userURLs[key] = urlDatabase[key];
    };
  };
  return userURLs;
};

const users = {
  A10000: {
    id: 'A10000',
    email: 'first@gmail.com',
    password: 'first'
  },
  A10100: {
    id: 'A10100',
    email: 'second@gmail.com',
    password: 'second'
  }
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const id = req.cookies.user_id;
  let templateVars = {user: users[id]};
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const {email, pass} = req.body;
  users[id] = {};
  users[id].id = id;
  users[id].email = email;
  users[id].password = pass;
  
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const id = req.cookies.user_id;
  let templateVars = {user: users[id]};
  res.render('login', templateVars);

});

app.post('/login', (req, res) => {
  const { email, pass} = req.body;
  let id;
  for (key in users) {
    if (users[key].email === email && users[key].password === pass) {
      id = users[key].id;
    }
  }
  if (id === undefined) {
    res.status(403);
    res.send('Invalid Login');
  }
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.cookies.user_id);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const id = req.cookies.user_id;
  const urls = urlsForUser(id);
  let templateVars = { urls, user: users[id]};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const id = req.cookies.user_id;
  if ( id === undefined) {
    res.redirect('/login')
  }
  let templateVars = { user: users[id] };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  let {id} = req.params
  const userId = req.cookies.user_id;
  const url = urlDatabase[id].long;
  let templateVars = { shortURL: req.params.id, url, user: users[userId] };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const id = req.cookies.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  if (urlDatabase[shortURL].user === id) {
    urlDatabase[shortURL].long = newLongURL;
  };
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const id = req.cookies.user_id;
  const newId = generateRandomString();
  const {longURL} = req.body;
  urlDatabase[id][newId] = longURL;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = (req.params);
  const longURL = urlDatabase[shortURL].long;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  id = req.cookies.user_id;
  const shortURL = req.params.id;
  if (urlDatabase[shortURL].user === id) {
    delete urlDatabase[shortURL];
  };
  res.redirect('/urls');

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});