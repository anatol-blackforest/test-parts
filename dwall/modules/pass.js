const jwt = require('jsonwebtoken');
const bCrypt = require('bcrypt');
const DB = require("./sql.js");
const fs = require('fs');
/**
 * Secret key for symmetric encoding
 * @type {String}
 * @private
 */
const SECRET_KEY = '05cfb0713e268d992510662b6ab63054a8ee048231d8f140828003d1e9ae0297';

/**
 * Algorithm that using for signing JWT
 * @type {String}
 * @private
 */
const ALGORITHM = 'HS256';

/**
 * Time interval in minutes when token will be expired or false if not expires
 * @type {Number}
 * @private
 */
const EXPIRES = 60 * 60 * 24 * 1;

class JwtCipher {
  constructor() {
    this.jwtConf = {
      key: SECRET_KEY
    };
  }

  hashSync(content) {
    return jwt.sign(content, this.jwtConf.key, {
      algorithm: ALGORITHM,
      expiresIn: EXPIRES
    });
  }

  isAuthenticated (){
    return (req, res, next) => {
      try{
        if (req.method == "OPTIONS") next();
        if (!req.headers.authorization) {
          return res.status(401).send({message:"Invalid token, unauthorized.1"});
        }
        const token = req.headers.authorization.toString().replace('Bearer ', '') || req.body.token;
        if (token) {
          jwt.verify(token, this.jwtConf.key, (err, decoded) => {
            if(err){
              res.status(401).send({message:"Invalid token, unauthorized.2"});
            }else{
              req.user = decoded;
              req.session.userId = decoded.id;
              return next();
            }
          });
        }else {
          res.status(401).send({message:"Invalid token, unauthorized.3"});
        }
      } catch(err) {
        return next(err);
      }
    }
  }

  login (payload){
    console.log('[payload]', payload);
    // payload.pass
      let validUser

      return DB.query('SELECT * FROM users WHERE email = :email', {email: payload.email}, 'users')
      .then(([user]) => {
        validUser = user
        if (!user) return user;
        return bCrypt.compare(payload.pass, user.pass)
      })
      .then((result) => {
        if(result){
          return validUser
        }else{
          throw Error("invalid password or email")
        }
      })
      .catch(err => {
        console.log('[ERROR]', err);
        return err;
      });
    

  }
}

module.exports = new JwtCipher();