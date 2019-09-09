let moment = require('moment-timezone');
let uControllerFunction = require('./controllers/user.js');
let fs = require('fs');
let nodemailer = require('nodemailer');
let userCtrl = new uControllerFunction();

const cron = new CronJob();
cron.run();

function CronJob() {

    this._isAlreadyExpired = function (expires) {
        return (moment().diff(moment(expires.split('T')[0]), 'days') === 1);
    }

    this.run = function () {
        Promise.all([this.job1(), this.job2()])
            .then(resp => {
                console.log('jobs are done', resp);
                process.exit();
            });
    }

    this._transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'info@dwall.online',
            pass: 'AbyacFiOjBiUfN7'
        }
    });

    this.job1 = function () {
        return Promise.resolve(null);
    }

    this.job2 = function () {
        return userCtrl.getAllUsers()
            .then(data => {
                return data.filter(user => {
                    if (Boolean(user.licence_expires)) {
                        if (moment(user.licence_expires.split('T')[0]).diff(moment(), 'days') === 1) {
                            return true;
                        } else if(moment(user.licence_expires.split('T')[0]).diff(moment(), 'days') === 3) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                });
            })
            .then(list => {
                return new Promise((resolve, reject) => {
                    fs.readFile(__dirname + '/views/mail/expiration.html', {
                        encoding: 'utf8'
                    }, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                html: data,
                                list: list
                            });
                        }
                    })
                })
            })
            .then(data => {
                return data.list.map(user => {
                    let expiresMsg = this._isAlreadyExpired(user.licence_expires) ?
                        `has expired.` :
                        `is going to expire on ${moment(user.licence_expires.split('T')[0]).add(1, 'days').format('MMMM Do YYYY')}`;
                    user.subject = this._isAlreadyExpired(user.licence_expires) ?
                        `DWall.Online account has expired for ${user.email}.` :
                        `DWall.Online account is going to expire soon for ${user.email}.`;
                    user.html = data.html.toString()
                        .replace('{{name}}', user.first_name)
                        .replace('{{expiresMsg}}', expiresMsg)
                    return {
                        html: user.html,
                        subject: user.subject,
                        email: user.email
                    }
                })
            })
            .then(results => {
                let promises = [];
                results.forEach(user => {
                    promises.push(new Promise((resolve, reject) => {
                        this._transporter.sendMail({
                            to: user.email,
                            bcc: 'info@dwall.online',
                            subject: user.subject,
                            html: user.html
                        }, function (error, info) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve({
                                    message: 'Done'
                                });
                            }
                        })
                    }));
                })
                return Promise.all(promises);
            })
            .catch(err => console.log('[err]', err));
    }
}