var s3 = require('s3');
var fs = require('fs');
var S3FS = require('s3fs')


function awsFileLoader(){
    if (arguments.callee._singletonInstance) {
        return arguments.callee._singletonInstance;
      }
    
      arguments.callee._singletonInstance = this;

    this.uploadFileToAmazon = function(){
        return new Promise((resolve, reject) => {

        });
    };
    this.deleteFileFromAmazon = function(){
        return new Promise((resolve, reject) => {

        });
    };
}

module.exports = new awsFileLoader();