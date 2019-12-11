const express = require("express");
const app = express();
const PORT = 8080;

//COOKIE PARSER MIDDLEWARE
let cookieParser = require('cookie-parser');
app.use(cookieParser());

//BODY PARSER MIDDLEWARE
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const bcrypt = require('bcrypt');

//PASS THE NUMBER OF CHARACTERS YOU'D LIKE TO PRODUCE
const generateRandomString = (length) => {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};

//EMAIL LOOKUP HELPER
const emailLookupHelper = (email) => {
  let usersValuesArr = Object.values(users);
  for (let userValue of usersValuesArr) {
    if (userValue.email === email) {
      return true;
    }
  }
  return false;
};

//VERIFY USER HELPER
const verifyUser = (email, password) => {
  let usersValuesArr = Object.values(users);
  for (let userValue of usersValuesArr) {
    if (userValue.email === email && bcrypt.compareSync(password, userValue.hashedPassword)) {
      return userValue.id;
    }
  }
  return false;
};

//VALIDATES USER ACCESS TO SPECIFIC ROUTES/PAGES
const urlsForUser = (id) => {
  let urlsForUser = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlsForUser[url] = urlDatabase[url];
    }
  }
  return urlsForUser;
};
  
// //OLD URL DATA
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };


//NEW DATA OBJECT OF OBJECTS
const urlDatabase = {
  b6UTxQ: { longURL: "http://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "http://www.google.ca", userID: "userRandomID" },
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user2RandomID" },
  sm5xK9: { longURL: "http://jaysfromthecouch.com/", userID: "user2RandomID" }
};

//USERS
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

// //HOME PAGE
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

//URLS GET REQUEST
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    userID: users[req.cookies["user_id"]]
  };
  if (req.cookies["user_id"]) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//NEW URLS GET REQUEST TO RENDER PAGE
app.get("/urls/new", (req, res) => {
  let templateVars = { userID: users[req.cookies["user_id"]]  };
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//RENDERS REGISTRATION PAGE
app.get("/register", (req, res) => {
  let templateVars = { userID: users[req.cookies["user_id"]]  };
  res.render("register", templateVars);
});

//REDIRECT AFTER COMPLETING THE REGISTRATION FORM
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request -- Fields Cannot Be Empty');
  } else if (emailLookupHelper(req.body.email)) {
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
    console.log(users);
    res.cookie('user_id', userID);
    res.redirect("/urls");
  }
});

//RENDERS LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = { userID: undefined};
  res.render("login", templateVars);
});

//LOGIN POST ROUTE & REDIRECT TO /URLS
app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request -- Fields Cannot Be Empty');
  } else if (!emailLookupHelper(req.body.email) || !verifyUser(req.body.email, req.body.password)) {
    res.status(403).send('403 Error: Forbidden');
  } else {
    console.log(users);
    let userID = verifyUser(req.body.email, req.body.password);
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

//POST REQUEST TO GENERATE NEW SHORT & LONG URL IN DATABASE --> REDIRECT TO urls_show
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect(`/urls/${shortURL}`);
});

//SHORT URL GET REQUEST --> NEEDS TO BE AFTER NEW URLS GET REQUEST
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: users[req.cookies["user_id"]]
  };
  if (req.cookies["user_id"]) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

//REDIRECTS TO LONG URL FROM SHORT URL -- EXAMPLE:"/u/gs5las"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//EDIT BUTTON REDIRECT ON INDEX PAGE TO URL SHOW
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
  //res.redirect(`/urls/${req.params.shortURL}`);
});

//EDIT POST ROUTE TO UPDATE URL RESOURCE
app.post("/urls/:id", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send('403 Error: Forbidden');
  }
});

//DELETE BUTTON POST ON INDEX PAGE
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send('403 Error: Forbidden');
  }
});

//LOGOUT POST ROUTE & REDIRECT TO /URLS
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

// //GET json FILE OF URLDATABASE
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// //HELLO ROUTE
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

//LISTENING
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//EXAMPLE OF TWO REQUESTS THAT WON'T WORK TOGETHER DUE TO SCOPE
// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
//  });
 
//  app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
//  });