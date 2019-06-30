const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let get = true;
let jsonArr

async function page (url) {
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.goto(url);
    const bodyHandle = await page.$('body');
    const html = await page.evaluate(body => body.innerHTML, bodyHandle);
    browser.close();
    return {html, url};
};

module.exports = async(req, res) => {

    if (get === false) return res.render('index', { objects: jsonArr })
    get = false;
    jsonArr = [];
    const arr = req.body.description.trim().replace(/\s+/g,' ').split(' ')
    const p = arr.map(link => page(link).catch((err) => err));
    
    Promise.all(p)
      .then(result => {
        result.forEach((item, i) => {
            if (!item.html) return false
            let $ = cheerio.load(item.html);
            let product_name = $('h1').text().trim()
            let price = $('.detail-price-uah').text().trim()
            jsonArr.push({
              product_name,
              price,
              link: item.url
            });
        });
      })  
      .then(() => {
        get = true;
        res.status(200).json(jsonArr)
        req.io.sockets.emit('message', jsonArr);
      })
      .catch((err) => {
        get = true;
        res.render('index')
      })

  }   


