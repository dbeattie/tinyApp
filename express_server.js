const express = require("express");
const app = express();
const PORT = 8080; 

//COOKIE PARSER MIDDLEWARE
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//BODY PARSER MIDDLEWARE
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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
      if (userValue.email === email && userValue.password === password) {
        return userValue.id;
      }
    }
    return false;
  }
  

//DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//USERS
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "5678"
  }
}

//HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

//URLS GET REQUEST
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, userID: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

//NEW URLS GET REQUEST TO RENDER PAGE
app.get("/urls/new", (req, res) => {
  let templateVars = { userID: users[req.cookies["user_id"]]  };
  res.render("urls_new", templateVars);
});

//RENDERS REGISTRATION PAGE
app.get("/register", (req, res) => {
  let templateVars = { userID: users[req.cookies["user_id"]]  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let userID = generateRandomString(4);
  let newUser = { 
    id: userID, 
    email: req.body["email"],
    password: req.body["password"]
  }

  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request -- Fields Cannot Be Empty');
  } else if (emailLookupHelper(req.body.email)) {
    res.status(400).send('400 Error: Bad Request')
  } else {
    users[userID] = newUser;
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
    res.status(403).send('403 Error: Forbidden')
  } else {
    let userID = verifyUser(req.body.email, req.body.password);
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

//POST REQUEST TO GENERATE NEW SHORT & LONG URL IN DATABASE --> REDIRECT TO urls_show
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//SHORT URL GET REQUEST --> NEEDS TO BE AFTER NEW URLS GET REQUEST
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    userID: users[req.cookies["user_id"]] 
  };
  res.render("urls_show", templateVars);
});

//REDIRECTS TO LONG URL FROM SHORT URL -- EXAMPLE:"/u/gs5las"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//EDIT BUTTON REDIRECT ON INDEX PAGE TO URL SHOW
app.post("/urls/:shortURL/edit", (req, res) => {
    res.redirect(`/urls/${req.params.shortURL}`);
});

//EDIT POST ROUTE TO UPDATE URL RESOURCE
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//DELETE BUTTON POST ON INDEX PAGE
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
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