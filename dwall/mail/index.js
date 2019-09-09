const path = require('path');
const bluebird = require('bluebird');
const MailService = require('./mailService');
//const ReportGenerator = require('./reportGenerator');

class MailWorker {
	constructor() {
	}

	async init(options) {
		try {
			const env = options && options.env || process.env.NODE_ENV || 'local';
			//this.db = DBLoader.load(this.injector, config.get('mongodb'));
			await this.processEmails();
		} catch (err) {
			console.trace(err);
		}
	}

	async processEmails() {
		//this.logger.info("Mail service started");
		const mailService = new MailService();
		await mailService.init();
		let emails = await mailService.getEmailList();
		//this.logger.info("Found email: " + emails.length);
		//console.log('[emails]', emails.length);
		/*await bluebird.each(emails, async (item) => {
			try {
				console.log('[item]', item);
				//let reportGenerator = new ReportGenerator(this.injector, item);
				//await reportGenerator.save();
			} catch (error) {
				await mailService.sendMail({
					subject: "Error in report",
					senderName: "Blipic",
					receiver: item.from.value[0].address,
					text: error.message || error
				});
				//this.logger.error(error);
			}
		});*/
		console.log('[emails]', emails);
		emails.forEach(item => {
				console.log('[item]', item);
		});
		//this.logger.info("Mail service finished");
		process.exit();
	}

	injectModels() {
		const models = _.clone(this.models);
		_.forOwn(models, (model, key, object) => {
			delete object[key];
			object[`${key}Model`] = model;
		});
		this.injector.setObject(models);
	}
}

const mailWorker = new MailWorker();
mailWorker.init();
