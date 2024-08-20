const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  for(let countPage = 1; countPage <= 50; countPage++) {
    await page.goto(`https://books.toscrape.com/catalogue/page-${countPage}.html`);
    const fetchDetails = await page.evaluate(() => {
      const allDetails = document.querySelectorAll(".product_pod");

      let detailsArray = [];
      allDetails.forEach((eachItem) => {
        const itemTitle = eachItem.querySelector("h3 a").title;
        const itemPrice = eachItem.querySelector(".price_color").innerText;
        const imgUrl = eachItem.querySelector("img").src;

        detailsArray.push({
          title: itemTitle,
          price: itemPrice.replace("£", "R$ "),
          imageURL: imgUrl,
        });
      });

      return detailsArray;
    });
    console.log(fetchDetails);

  }

  await browser.close();
})();


