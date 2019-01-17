const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
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
}

app.get('/', (req, res) => {
  res.send("Hello. You are at the root!");
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
  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.cookies.user_id);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const id = req.cookies.user_id;
  let templateVars = { urls: urlDatabase, user: users[id]};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  id = req.cookies.user_id;
  let templateVars = { user: users[id] };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const id = req.cookies.user.id;
  const url = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, url, user: users[id] };
  res.render('urls_show', templateVars);
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
});

app.post('/urls', (req, res) => {
  const newId = generateRandomString();
  const {longURL} = req.body;
  urlDatabase[newId] = longURL;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = (req.params);
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});