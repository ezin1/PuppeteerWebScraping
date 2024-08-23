const puppeteer = require("puppeteer");
const producer = require("../../infra/kafka/kafka");

async function webScraping() {
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

      fetchDetails.push({
        title: book.title,
        price: book.price,
        imageURL: book.imageURL,
        description: description,
      });
    }

    console.log(fetchDetails);

    try {
      await producer.send({
        topic: "scraping",
        messages: [
          {
            value: JSON.stringify(fetchDetails),
          },
        ],
      });
    } catch (error) {
      console.error("Failed to send data to Kafka:", error);
    }
  }

  await browser.close();
}

module.exports = { webScraping };
