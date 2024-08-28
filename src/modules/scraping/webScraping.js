const puppeteer = require("puppeteer");
const KafkaProducer = require("../../main/infra/kafka/kafka");
const { Client } = require('pg');

async function connectAndSaveData(fetchDetails) {
  try {
    // Connect to PostgreSQL database
    const client = new Client({
      user: 'irehdqyu',
      host: 'isabelle.db.elephantsql.com',
      database: 'irehdqyu',
      password: '6DGK9C6-OCMcm11Ku2w0-MY_iBNbCufX',
      port: 5432,
    });
    await client.connect();

    for (const book of fetchDetails) {
      const query = `
        INSERT INTO books (title, price, imageURL, inStock, description)
        VALUES ($1, $2, $3, $4, $5)
      `;
      const values = [
        book.title,
        book.price,
        book.imageURL,
        book.inStock,
        book.description,
      ];
      await client.query(query, values);
    }

    // Disconnect from the database
    await client.end();
  } catch (error) {
    console.error('Error connecting to or saving data in the database:', error);
  }
}


async function webScraping() {
  const producer = new KafkaProducer({
    clientId: "scraping-client",
    brokers: ["localhost:19092"],
    topic: "scraping-topic",
    timeout: 30000,
  });

  // await producer.connect();

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
    await connectAndSaveData(fetchDetails);
   
    // await producer.sendMessage(JSON.stringify(fetchDetails));

    
    await page.waitForTimeout(2000);
  }

  await browser.close();
  // await producer.disconnect();
}

module.exports = { webScraping };