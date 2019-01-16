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

app.get('/', (req,res) => {
  res.send("Hello. You are at the root!");
});

app.post('/login', (req, res) => {
  
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username', req.cookies.username);
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username};
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {username: req.cookies.username};
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const url = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, url, username: req.cookies.username };
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
}