// definitely rquires refactoring

const express = require("express");
const crypto = require("crypto");
const app = express();
const bodyParser = require('body-parser');
const http = require("http");
const nodemailer = require("nodemailer");
const session = require('express-session');
const JwtCipher = require('./modules/pass.js');
const tvRoute = require("./routers/tvRoute.js");
const usersRoute = require("./routers/routes/users.router.js");
const helpersRoute = require("./routers/routes/helpers.router.js");
const devicesRoute = require("./routers/routes/devices.router.js");
const settingsRoute = require("./routers/routes/settings.router.js");
const licensesRoute = require("./routers/routes/licenses.router.js");
const mediaRoute = require("./routers/routes/media.router.js");
const contactRoute = require("./routers/routes/contact.router.js");
const server = http.createServer(app);
const send = require("./services/logger.service.js");

const SocketService = require("./services/socket.service.js");
const fs = require('fs');
const uControllerFunction = require("./controllers/user.js");
const distDir = __dirname + "/ui/dist/";
const cors = require('cors');

app.use(cors());
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info@dwall.online',
    pass: 'AbyacFiOjBiUfN7'
  }
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/ui/landing/landing.html');
});

app.get('/ua', function(req, res) {
  res.sendFile(__dirname + '/ui/landing/landing-ua.html');
});

app.get('/become-a-partner', function(req, res) {
  res.sendFile(__dirname + '/ui/landing/become-a-partner.html');
});

app.get('/supported-devices', function(req, res) {
    res.sendFile(__dirname + '/ui/landing/devices.html');
});

app.get('/supported-devices-ua', function(req, res) {
  res.sendFile(__dirname + '/ui/landing/devices-ua.html');
});

app.use(express.static(distDir));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json({limit:"1000mb"}));
app.use(bodyParser.urlencoded({
  extended: true,
  parameterLimit: 100000000000,
  limit:'1000mb'
}));

app.use("/views", express.static('views'));
app.use("/style", express.static('views/style'));
app.use("/video", express.static('views/video'));
app.use("/script", express.static('views/script'));
app.use("/scripts", express.static('views/scripts'));
app.use("/app", express.static('app'));
app.use("/", express.static("ui/landing"));

app.use(session({ secret: "iamTopsecret", resave: false, saveUninitialized: false, cookie: { maxAge: 604800000 }}));

app.get("/app", function(req, res, next){
  res.sendFile(__dirname + "/app/dWall.wgt");
});

app.get("/userguide", function(req, res, next){
  res.sendFile(__dirname + "/userguide/userguide.pdf");
});


app.post('/getDwall', function(req, res) {

  let uController = new uControllerFunction();
  let lController = require("./controllers/licenses.controller.js");
  let pass = crypto.randomBytes(20).toString('hex').slice(-8);
  let newUserData = {
    email: req.body.email,
    first_name: req.body.name,
    pass
  };
  return uController.getUserIdByEmail(newUserData.email)
  .then((status) => { 
      if(status){ res.status(400).send(
        `The provided e-mail address ${newUserData.email} is already in use in DWall.Online system. Please, use different e-mail or contact our support at support@dwall.online.`
      ); }
   })
  .then(() => {
      return uController.insertNewUser(newUserData);
  })
  .then((userId) => {
      return lController.createLicense({
          userId,
          singlecast: 10, 
          multicast: JSON.stringify([])
      });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      let template = fs.readFile('./views/mail/mail.html', function(err, data) {
        if (err) {
          console.log(err);
        } else {
          data = data.toString()
            .replace('{{name}}', req.body.name)
            .replace('{{pass}}', pass)
            .replace('{{email}}', req.body.email)
            .replace('{{host}}', req.headers.origin);
          transporter.sendMail({
            to: req.body.email,
            bcc: 'info@dwall.online',
            subject: 'DWall.Online credentials',
            html: data
          }, function(error, info){
            if (error) {
              reject(error);
            } else {
              resolve({message: 'Done'});
            }
          });
        }
      });
    });
  })
  .then(() => {
      res.status(200).send("Thank you for your request. Please, check your e-mail");
      return;
  })
  .catch((error) => {
      console.log("getDwall error")
      console.log(error)
      res.status(500).send(error);
  });
});

app.post('/login', function(req, res, next) {
  req.body.email = req.body.email.trim();
  let info = {event: "login", email: req.body.email} 
  JwtCipher.login(req.body)
  .then((user) => {
    if (user instanceof Error) throw Error(user)
    if (!user) {
      send.error(null, "Login", req, res, {message: "Wrong user email or password"}, 401, info)
    } else {
      if (new Date() > new Date(user.license_expires)) {
        send.error(user.id, "Login", req, res, {message: 'Your аccount has expired. If you like the product, please contact us at sales@dwall.online.'}, 401, info)

      } else {
        let uController = new uControllerFunction();
        const timestamp = new Date().toISOString();
        return Promise.all([uController.updateUser(user.id, {last_login: timestamp}), user]);
      }
    }
  })
  .then(([data, user]) => {
    send.log(user.id, "Login", req, res, {token: JwtCipher.hashSync({id: user.id})}, 200, info)
  })
  .catch(err => {
    console.log('[ERROR]', err);
    // res.status(401).send({message: "Wrong user email or password"});
    send.error(null, "Login", req, res, {message: "Wrong user email or password"}, 401, info)
  });
});


app.get('/logout', JwtCipher.isAuthenticated(), function(req, res){
  req.session.destroy(function (err) {
    send.log(req.user.id, "Logout", req, res, "ok", 200)
    //res.status(200).send("ok");
  });
});

/*app.post("/signup", myPassport.authenticate('local-signup',{
  successRedirect:'/main',
  failureRedirect:'/signUpFailure'
}));*/

app.get("/main", function(req, res){
  res.sendFile(__dirname + '/ui/dist/index.html');
});

app.get("/main/*", function(req, res){
  res.sendFile(__dirname + '/ui/dist/index.html');
});

// TEMPORARY FIX FOR NEW ANOTHER TV CREATION ROUTE
// app.post("/devices", checkAuth, tvServices.addNew);

app.use("/tv", tvRoute);
app.use("/user", JwtCipher.isAuthenticated(), usersRoute);
app.use("/helpers", JwtCipher.isAuthenticated(), helpersRoute);
app.use("/devices", JwtCipher.isAuthenticated(), devicesRoute);
app.use("/settings", JwtCipher.isAuthenticated(), settingsRoute);
app.use("/licenses", JwtCipher.isAuthenticated(), licensesRoute);
app.use("/media", JwtCipher.isAuthenticated(), mediaRoute);
app.use("/contact", contactRoute);

app.use("*", function(req, res){
  res.sendFile(__dirname + '/ui/dist/index.html');
});

server.listen(  process.env.PORT || 3000 , function(){
	console.log(`[SERVER::PORT] ${process.env.PORT || 3000}`);
});

module.exports = new SocketService(server);
