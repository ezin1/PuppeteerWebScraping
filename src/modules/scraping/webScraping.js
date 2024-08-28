const puppeteer = require("puppeteer");
const KafkaProducer = require("../../main/infra/kafka/kafka");

async function webScraping() {
  const producer = new KafkaProducer({
    clientId: "scraping-client",
    brokers: ["localhost:19092"],
    topic: "scraping-topic",
    timeout: 30000,
  });

  await producer.connect();

  const browser = await puppeteer.launch({
    headless: false, 
  });

  const page = await browser.newPage();

  for (let countPage = 1; countPage <= 2; countPage++) {
    await page.goto(
     `https://books.toscrape.com/catalogue/page-${countPage}.html`
    );

    const booksOnPage = await page.evaluate(() => {
      const allDetails = document.querySelectorAll(".product_pod");

      const detailsArray = [];
      allDetails.forEach((eachItem) => {
        const itemTitle = eachItem.querySelector("h3 a").title;
        const itemPrice = eachItem.querySelector(".price_color").innerText;
        const imgUrl = eachItem.querySelector("img").src;
        const bookUrl = eachItem.querySelector("h3 a").getAttribute("href");

        detailsArray.push({
          title: itemTitle,
          price: itemPrice.replace("£", "R$ "),
          imageURL: imgUrl,
          bookUrl: `https://books.toscrape.com/catalogue/${bookUrl}`,
        });
      });

      return detailsArray;
    });

    const fetchDetails = [];

    for (const book of booksOnPage) {
      await page.goto(book.bookUrl);

      const description = await page.evaluate(() => {
        const descElement = document.querySelector("#product_description ~ p");
        return descElement ? descElement.innerText : "No description available";
      });

      const inStock = await page.evaluate(() => {
        const stockElement = document.querySelector(".instock.availability");
        return stockElement ? stockElement.innerText : "Out of stock";
      });

      fetchDetails.push({
        title: book.title,
        price: book.price,
        imageURL: book.imageURL,
        inStock: inStock.trim(), 
        description: description,
      });
    }

    console.log(fetchDetails);

   
    await producer.sendMessage(JSON.stringify(fetchDetails));

    
    await page.waitForTimeout(2000);
  }

  await browser.close();
  await producer.disconnect();
}

module.exports = { webScraping };