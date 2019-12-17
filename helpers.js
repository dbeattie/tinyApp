const bcrypt = require('bcrypt');

const getUserByEmail = (email, database) => {
  let usersValuesArr = Object.values(database);
  for (let userValue of usersValuesArr) {
    if (userValue.email === email) {
      return userValue.id;
    }
  }
  return undefined;
};

//PASS THE NUMBER OF CHARACTERS YOU'D LIKE TO PRODUCE AS A RANDOM STRING
const generateRandomString = (length) => {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
};

//RETURNS SHORTURL ACCESS TO SPECIFIC ROUTES/PAGES
const urlsForUser = (id, database) => {
  let urlsForUser = {};
  for (let url in database) {
    if (database[url].userID === id) {
      urlsForUser[url] = database[url];
    }
  }
  return urlsForUser;
};

const verifyUser = (email, password, userDatabase) => {
  let usersValuesArr = Object.values(userDatabase);
  for (let userValue of usersValuesArr) {
    if (userValue.email === email && bcrypt.compareSync(password, userValue.hashedPassword)) {
      return userValue.id;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  verifyUser
};