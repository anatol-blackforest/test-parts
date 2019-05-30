const util = require('util');
const _request = require('request');
const request = util.promisify(_request);
const cheerio = require('cheerio');
const path = require('path');
const Comment = require('../models');

// jsonArr так себе решение, и в случае слишком высокого потребления памяти имеет смысл кешировать камменты в текстовые файлы
let jsonArr 

class commentsController {

    getComments(req, res) {
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
          .then(() => res.render('index', { objects: jsonArr }))
          .catch(console.log);
    }   

    saveComments (req, res) {
        if (!jsonArr || jsonArr.length === 0) return res.render('index');
        Comment.insertMany(jsonArr)
        .then((result) => {
          console.log(result)
          res.render('index', { objects: jsonArr })
          jsonArr = []
        }).catch((err) => {
          console.log(err)
          res.render('index')
        })
    }

}
  
module.exports = new commentsController();
