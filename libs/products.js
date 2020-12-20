const axios = require('axios');
const cheerio = require('cheerio');
// @export
async function getProductListTotal(param) {
  return new Promise(async (resolve, reject) => {
    try {
      const { pageStart, pageLast, delay, displayCnt, dateString } = param;
      let result = [];
      let productList = [];
      let logMsg = `Today is ${dateString} crawling ${pageLast} pages with ${displayCnt}\n`;
      for (let page = pageStart; page <= pageLast; page++) {
        productList = await getProductListDelay({ delay, displayCnt, page });
        result = result.concat(productList);
        logMsg = `${logMsg} Success get page ${page}\n`;
      }
      console.log(logMsg);

      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

function getProductListDelay(param) {
  const { delay, displayCnt, page } = param;
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const html = await getHtml({ displayCnt, page });
        const productList = await getProductList(html);
        resolve(productList);
      } catch (e) {
        reject(e);
      }
    }, delay);
  });
}
function getProductList(html) {
  return new Promise((resolve, reject) => {
    try {
      const $ = cheerio.load(html);
      const $nodes = $('#goodsRankList').children();
      let result = [];
      $nodes.each(function (i, elem) {
        const priceOrigin = $(this).find('p.price').text().trim();
        //   "//image.msscdn.net/images/goods_img/{img}"
        const img = $(this).find('div.list_img a.img-block img.lazyload').attr('data-original');
        // .split("/");
        const rankOrigin = $(this)
          .find('p.n-label.label-default.txt_num_rank')
          .children() //select all the children
          .remove() //remove all the children
          .end() //again go back to selected element
          .text()
          .trim();
        const rankLength = String(rankOrigin).length;

        const rank = rankOrigin.substring(0, rankLength - 1); //Remove String "위"
        const brand = $(this).find('p.item_title a').text();
        const brandEN = $(this).find('p.item_title a').attr('href').split('/').slice(-1)[0];
        const name = $(this).find('p.list_info a').attr('title');
        const price = getOnlyPrice(priceOrigin);
        const serialNo = $(this).attr('data-goods-no');
        result.push({ rank, brand, brandEN, name, price, img, serialNo });
      });
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
}

function getHtml(params) {
  // range=1d 일간 랭킹
  return new Promise(async (resolve, reject) => {
    try {
      const { page } = params;
      const url = `https://search.musinsa.com/ranking/best?period=day&page=${page}`;
      const res = await axios.get(url);
      resolve(res.data);
    } catch (e) {
      reject(e);
    }
  });
}

function getOnlyPrice(price_) {
  const blankRegex = /\s/g;
  if (!blankRegex.exec(price_)) return price_.replace('원', '').replace(',', '');
  const price = price_.split('\n').slice(-1)[0].trim();
  return price.replace('원', '').replace(',', '');
}

module.exports = {
  start: getProductListTotal,
};
