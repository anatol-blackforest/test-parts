const DB = require("../modules/sql.js");

function stripeController() {
  this.createStripe = function() {
    //TO DO
  }

  this.getStripeById = function(params, mask) {
    return DB.query("SELECT s.id, s.text_data AS text, v.media_name AS name  FROM video AS v JOIN stripes AS s ON v.stripe_id = s.id WHERE v.id = :id", params, mask);
  }

  this.updateStripe = function(id, params) {
    //TO DO
  }

  this.deleteStripe = function(id) {
    //TO DO
  }
}

module.exports = new stripeController();