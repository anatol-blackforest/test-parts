import exifParser from 'exif-js';
import activityTypes from '../../../config/email-activities.json';
import _ from 'lodash';


export default class ReportGenerator {
	constructor(injector, email) {
		this.logger = injector.get('logger');
		this.injector = injector;
		this.restService = this.injector.get('RestService');
		this.author = email.from.value[0];
		this.subject = email.subject;
		this.photo = email.attachments[0];

		this.imgMetadata = {lon: 0, lat: 0};
		this.user = null;
		this.company = null;
		this.file = null;
		this.point = null;
	}

	/**
	 * Upload photo to s3 and add to files collection
	 * @returns {Promise.<{
	 * 	url: string,
	 * 	fileId: ObjectId
	 * }>}
	 */
	async uploadPhoto() {
		if (!this.photo) return null;
		const s3 = this.injector.get('S3Service');
		const File = this.injector.get('FilesModel');

		const s3Result = await s3.createFromBuffer(this.photo.filename, this.photo.content);
		this.file = await File.create({
			url: s3Result.Location,
			author: this.user._id,
			storage: 'AWS'
		});

		this.imgMetadata = await this.parseMetaData(this.photo.content);
		return {url: s3Result.Location, fileId: this.file._id};
	}

	async save() {
		await this.detectUser();
		await this.uploadPhoto();
		await this.createPoint();
		await this.createGeofenceActivity();
	}

	async detectUser() {
		const User = this.injector.get('UsersModel');
		this.user = await User.findOne({email: this.author.address});
		this.company = await User.findOne({email: this.author.address});
		if (!this.user) {
			throw `User ${this.author.address} is not found`;
		}
	}

	async createGeofenceActivity() {
		const GeofenceActivity = this.injector.get('GeofenceActivitiesModel');
		let model = {};
		let activityData = await this.findActivity();
		model.isWellness = true;
		model.status = 'unchecked';
		model.isSelfReported = true;
		model.photoId = this.file._id;
		model.author = this.user._id;
		model.point = this.point._id;
		model.activityId = activityData.id;
		model.amount = activityData.userValue;
		model.points = activityData.amount * activityData.userValue;
		model.enterAt = new Date();
		model.exitAt = new Date();
		model.isChallenge = true;
		await GeofenceActivity.create(model);
		this.logger.info('Report created: ', model);
	}

	async createPoint() {
		const Points = this.injector.get('PointsModel');
		if (this.imgMetadata.lon < -180 || this.imgMetadata.lon > 180) {
			throw 'Longitude should be in range  between +/- 180';
		}
		if (this.imgMetadata.lat < -90 || this.imgMetadata.lat > 90) {
			throw 'Latitude should be in range  between +/- 90';
		}
		const data = {
			location: {
				coordinates: [
					this.imgMetadata.lon,
					this.imgMetadata.lat
				],
				type: 'Point'
			}
		};
		this.point = await Points.create({data});
		return this.point;
	}

	/**
	 * Get activity info by parsed activity name from subject
	 * @returns {{name: string, value: number, amount: number}}
	 */
	async findActivity() {
		if (!this.subject) {
			throw 'Invalid subject';
		}

		const regexp = /(.+?)(?:;|,).([0-9]+)(.*)/;
		let parsed = this.subject.match(regexp);
		if (!parsed) {
			parsed = [this.subject, this.subject, 1];
		}
		let company = await this.getCompanyInfo(this.user.companyId.toString());
		let pointSystem = await this.getPointSystem(company.countingSystem.toString());

		let activity = _.find(pointSystem.activities, (item) => {
			const original = item.activity.toLowerCase().trim();
			const target = parsed[1].toLowerCase().trim();
			return original === target;
		});
		if (!activity) {
			throw 'Invalid activity: ' + parsed[1];
		}
		return {
			id: activity.id,
			userValue: parsed[2],
			amount: activity.amount
		}
	}

	async getCompanyInfo(companyId) {
		try {
			const url = this.injector.get('config').get('remoteBackend');
			const uri = `${url}/secure/companies/${companyId}`;
			if (!this.token) {
				this.token = await this.remoteLogin();
			}
			const result = await this.restService.get(uri, {Authorization: `Bearer ${this.token}`});
			if (!result.data) {
				throw "";
			}
			return result.data;
		} catch (err) {
			this.logger.error(err);
			throw "User not found";
		}
	}

	async getPointSystem(systemId) {
		try {
			const url = this.injector.get('config').get('remoteBackend');
			const uri = `${url}/secure/counting/${systemId}`;
			if (!this.token) {
				this.token = await this.remoteLogin();
			}
			const result = await this.restService.get(uri, {Authorization: `Bearer ${this.token}`});
			if (!result.data) {
				throw "";
			}
			return result.data;
		} catch (err) {
			this.logger.error(err);
			throw "Problem with counting system";
		}
	}

	async remoteLogin() {
		const url = this.injector.get('config').get('remoteBackend');
		const login = this.injector.get('config').get('remoteUser');
		try {
			const uri = `${url}/tokens`;
			const headers = {Authorization: `Basic ${login}`};
			const response = await this.restService.post(uri, headers, {});
			this.token = response.data.token;
			return this.token;
		} catch(err) {
			throw new Error(err.message);
		}
	}

	/**
	 * Parse image's metadata and return coordinates from photo
	 * @param image
	 * @returns {Promise.<{
	 * 	lon: number,
	 * 	lat: number
	 * }>}
	 */
	async parseMetaData(image) {
		try {
			let res = exifParser.readFromBinaryFile(image.buffer);
			if (!res["GPSLongitude"] || !res["GPSLatitude"]) {
				return {lon: 0, lat: 0};
			}
			let lon = this.parseDMS(res["GPSLongitude"], res['GPSLongitudeRef']);
			let lat = this.parseDMS(res["GPSLatitude"], res['GPSLatitudeRef']);
			return {lon, lat};
		} catch (error) {
			return {lon: 0, lat: 0};
		}
	}

	/**
	 * Functions to convert coordinates to lon and lat
	 * @param input
	 * @param direction
	 * @returns {*}
	 */
	parseDMS(input, direction) {
		return this.convertDMSToDD(input[0], input[1], input[2], direction);
	}

	convertDMSToDD(degrees, minutes, seconds, direction) {
		let dd = degrees + minutes / 60 + seconds / (60 * 60);
		if (direction === "S" || direction === "W") {
			dd = dd * -1;
		}
		return dd;
	}
}
