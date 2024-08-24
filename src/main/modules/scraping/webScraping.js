const puppeteer = require("puppeteer");
const kafkaProducer = require("../../infra/kafka/kafka");

async function webScraping() {
  const producer = new kafkaProducer({
    clientId: "kafka_example",
    brokers: ["localhost:9092"],
    topic: "scraping",
  });

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  for (let countPage = 1; countPage <= 50; countPage++) {
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

    // Navega para cada livro individualmente e pega a descrição
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
        inStock: inStock,
        description: description,
      });
    }

    console.log(fetchDetails);

    const runProducer = async () => {
      await producer.connect();
      await producer.sendMessage(JSON.stringify(fetchDetails));
      await producer.disconnect();
    };

    await runProducer().catch(console.error);

    await page.waitForTimeout(2000);

    
  }

  await browser.close();
}

module.exports = { webScraping };
