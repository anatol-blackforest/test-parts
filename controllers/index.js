const util = require('util');
const _request = require('request');
const request = util.promisify(_request);
const cheerio = require('cheerio');
const path = require('path');
const Comment = require('../models');
const flags = {
  get: true,
  save: true
};
// jsonArr так себе решение, и в случае слишком высокого потребления памяти имеет смысл кешировать камменты в текстовые файлы
let jsonArr

class commentsController {

    getComments(req, res) {
      
        if (flags.get === false) return res.render('index', { objects: jsonArr })
        flags.get = false;
        jsonArr = [];
        const arr = req.body.description.trim().split(/\s*\r*\n+\s*/)
        const p = arr.map(link => request(link));
        Promise.all(p)
          .then(result => {
            result.forEach((item, i) => {
              let $ = cheerio.load(item.body);
              let product_name = $('.productpage__desctitle').text().trim()
              $('.comment_items ul').each(function(i, element){
                return jsonArr.push({
                  product_name,
                  author : $(this).find('span.comment_name_author').first().text().trim(), 
                  comment : $(this).find('.comment_text').first().text().trim(), 
                });
              });
            });
          })  
          .then(() => {
            flags.get = true;
            res.render('index', { objects: jsonArr })
          })
          .catch((err) => {
            console.log(err)
            flags.get = true;
            res.render('index')
          })
  

    }   

    saveComments (req, res) {
        if (flags.save === false || !jsonArr || jsonArr.length === 0) return res.render('index', { objects: jsonArr })
        flags.save = false;
        Comment.insertMany(jsonArr)
        .then((result) => {
          console.log(result)
          flags.save = true;
          jsonArr = []
          res.render('index', { title: "Saved!" })
        }).catch((err) => {
          console.log(err)
          flags.save = true;
          jsonArr = [];
          res.render('index', { title: "Not saved! :(" })
        })
    }

}
  
module.exports = new commentsController();
