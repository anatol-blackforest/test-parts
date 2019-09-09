
function tvConnection(tvCred, client, currentURL){
	this.currentConnection = 
	this.tvCred = tvCred;
	this.client = client;
	this.currentURL = currentURL;
	this.fallBack = null;
	this.playList = null;

	this.getNextMediaInSchedule = () => {
		return new Promise((resolve, reject => {

		}));
	},

	this.decideWhatToPlay = (url) => {
		return new Promise((resolve, reject) => {

		});
	}
}

module.exports = tvConnection;