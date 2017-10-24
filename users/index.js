const Datastore = require('@google-cloud/datastore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config');

const datastore = Datastore();

function validateInput(email, password) {
  if (!email || !password) {
    return false;
  }
  const isEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
  if (!isEmail) {
    return false;
  }
  return true;
}

function findUser(email) {
  const query = datastore.createQuery('Users')
    .filter('email', '=', email);

  return new Promise((resolve, reject) => {
    datastore.runQuery(query)
      .then((result) => {
        if (result[0].length) {
          const userKey = datastore.key(['Users', email]);
          resolve(result[0][0], userKey);
        } else {
          reject();
        }
      });
  });
}

function signToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.prod.jwtSecret, (err, token) => {
      if (err || !token) reject();
      resolve(token);
    });
  });
}

// @fn register
exports.register = function register(req, res) {
  const { email, password } = req.body;

  const valid = validateInput(email, password);
  if (!valid) {
    res.status(400).send('Invalid email or password');
    return;
  }

  findUser(email)
    .then(() => {
      res.status(400).send('Email is already exists');
    })
    .catch(() => {
      bcrypt.hash(password, config.prod.saltRounds, (err, hash) => {
        if (err) {
          res.status(500).send('Something went wrong! Please try again');
        } else {
          const newKey = datastore.key(['Users', email]);
          const entity = {
            key: newKey,
            data: {
              email,
              created_at: new Date(),
              updated_at: new Date(),
              password: hash,
              isAdmin: false,
            },
          };

          return datastore.save(entity)
            .then(() => res.status(200).end())
            .catch((errSave) => {
              console.error(errSave);
              res.status(500).send(errSave);
              return Promise.reject(errSave);
            });
        }
      });
    });
};

exports.login = function login(req, res) {
  const { email, password } = req.body;

  const valid = validateInput(email, password);
  if (!valid) {
    res.status(400).send('Invalid email or password');
    return;
  }

  findUser(email)
    .then((user, userKey) => {
      bcrypt.compare(password, user.password, (err, passed) => {
        if (err) {
          res.status(500).send('Error: bcrypt');
          return;
        }

        if (passed) {
          signToken({ userKey })
            .then(token => res.json({ token }))
            .catch(() => res.status(500).send('Error: token'));
        } else {
          res.status(400).send('Wrong password');
        }
      });
    })
    .catch(() => {
      res.status(400).send('Email not found');
    });
};
