const express = require("express");
const app = express();
const PORT = 8080; 

//BODY PARSER MIDDLEWARE
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//PASS THE NUMBER OF CHARACTERS YOU'D LIKE TO PRODUCE
function generateRandomString(length) {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

//DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

//URLS GET REQUEST
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//NEW URLS GET REQUEST TO RENDER PAGE
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let shortUrlKey = generateRandomString(6);
  urlDatabase[shortUrlKey] = req.body.longURL;
  res.redirect("/urls");    
});

//SHORT URL GET REQUEST --> NEEDS TO BE AFTER NEW URLS GET REQUEST
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

//GET json FILE OF URLDATABASE
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//HELLO ROUTE
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

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