const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let get = true;
let jsonArr

async function page (url) {
  // Launch a clean browser for every "job"
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
    const arr = req.body.description.trim().split(/\s*\r*\n+\s*/)
    const p = arr.map(link => page(link) );

    Promise.all(p)
      .then(result => {
        result.forEach((item, i) => {
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
        console.log(jsonArr)
        res.status(200).json(jsonArr)
        req.io.sockets.emit('message', jsonArr);
      })
      .catch((err) => {
        console.log(err)
        get = true;
        res.render('index')
      })

  }   


