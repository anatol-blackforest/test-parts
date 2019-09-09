const Imap = require('imap');
//const Promise = require('bluebird');
const simpleParser = require('mailparser').simpleParser;
const mailer = require('nodemailer-promise');

module.exports = class MailService {
	constructor() {
		this.imap = null;
		//this.config = injector.get('config');
	}

	init() {
		return new Promise((resolve, reject) => {
			this.mailer = mailer.config({
				email: ' info@dwall.online',
				password: 'AbyacFiOjBiUfN7',
				server: 'smtp.gmail.com'
			});
			this.imap = new Imap({
				user: ' info@dwall.online',
				password: 'AbyacFiOjBiUfN7',
				host: 'imap.gmail.com',
				port: 993,
				tls: true
			});
			this.imap.once('ready', () => {
				resolve();
			});
			this.imap.once('error', function (err) {
				reject(err);
			});
			this.imap.connect();
		})
	}

	sendMail({subject, senderName, receiver, text}) {
		let options = {
			subject: subject,
			senderName: senderName,
			receiver: receiver,
			text: text,
		};
		return this.mailer(options);
	}

	openInbox() {
		return new Promise((resolve, reject) => {
			this.imap.openBox('INBOX', false, (err, box) => {
				if (err) {
					return reject(err);
				}
				resolve(box);
			});
		});
	}

	searchEmails() {
		return new Promise((resolve, reject) => {
			this.imap.search(['UNSEEN'], (err, results) => {
				if (err) {
					return reject(err);
				}
				resolve(results)
			});
		})
	}

	async getEmailList() {
		await this.openInbox();
		let foundEmails = await this.searchEmails();
		if (!foundEmails.length) {
			return [];
		}
		console.log('[foundEmails]', foundEmails.length);
		let f = this.imap.fetch(foundEmails, {
			//markSeen: true,
			//struct: true,
			bodies: ''
		});
		let emails = await new Promise((resolve, reject) => {
			let emails = [];
			f.on('message', (msg, seqno) => {
				emails.push(this.getEmail(msg));
			});

			f.once('end', function () {
				resolve(emails);
			});
			f.once('error', function (err) {
				reject(err);
			});
		});
		return await Promise.all(emails);
	}

	async getEmail(msgEvents) {
		return await new Promise((resolve) => {
			msgEvents.on('body', function (stream, info) {
				let buffer = '';
				stream.on('data', function (chunk) {
					buffer += chunk.toString('utf8');
				});
				stream.once('end', function () {
					resolve(simpleParser(buffer));
				});
			});
		});
	}
}
