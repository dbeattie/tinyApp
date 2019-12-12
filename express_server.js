const express = require('express');
const methodOverride = require('method-override')
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  verifyUser
} = require('./helpers');

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "http://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "http://www.google.ca", userID: "userRandomID" },
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user2RandomID" },
  sm5xK9: { longURL: "http://jaysfromthecouch.com/", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: "$2b$10$.QkYXtO3ASSwH9anw48REekhLjB.U242E8w03gkx5eW4gXuSpLUPW"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "$2b$10$wHcU75ZpPcq1iUeBo6kSnOOuxnblT8hmiLIfHSFTYYcvynmUUsyku"
  }
};

//REDIRECTS HOME PAGE TO /URLS
app.get('/', (req, res) => {
  res.redirect('/urls');
});

//RENDERS URL INDEX PAGE
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    userID: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//RENDERS CREATE NEW URL'S PAGE
app.get("/urls/new", (req, res) => {
  let templateVars = { userID: users[req.session.user_id]  };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//GENERATES NEW SHORT & LONG URL IN DATABASE --> REDIRECTS TO URL'S SHOW
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

//RENDERS REGISTRATION PAGE
app.get("/register", (req, res) => {
  let templateVars = { userID: users[req.session.user_id]  };
  res.render("register", templateVars);
});

//REDIRECT AFTER REGISTRATION FORM COMPLETION
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request -- Fields Cannot Be Empty');
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('400 Error: Bad Request');
  } else {

    let userID = generateRandomString(4);
    const hashedPassword = bcrypt.hashSync(req.body['password'], 10);
    
    let newUser = {
      id: userID,
      email: req.body["email"],
      hashedPassword: hashedPassword
    };

    users[userID] = newUser;
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

//RENDERS LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = { userID: null};
  res.render("login", templateVars);
});

//LOGIN REDIRECT TO /URLS INDEX
app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request -- Fields Cannot Be Empty');
  } else if (!getUserByEmail(req.body.email, users) || !verifyUser(req.body.email, req.body.password, users)) {
    res.status(403).send('403 Error: Forbidden');
  } else {
    let userID = verifyUser(req.body.email, req.body.password, users);
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

//RENDERS /URLS SHOW CONDITIONALLY
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: users[req.session.user_id],
  };
  if (req.session.user_id) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

//REDIRECTS TO THE REAL LONG URL FROM SHORT URL LINK ON URL SHOW PAGE
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//EDIT BUTTON REDIRECT FROM INDEX PAGE TO URL SHOW PAGE
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

//UPDATES LONG URL RESOURCE ON SUBMISSION
app.put("/urls/:id", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send('403 Error: Forbidden');
  }
});

//DELETE BUTTON REDIRECTION ON INDEX PAGE
app.delete("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send('403 Error: Forbidden');
  }
});

//LOGOUT CLEARS COOKIES & REDIRECTS TO /URLS
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});