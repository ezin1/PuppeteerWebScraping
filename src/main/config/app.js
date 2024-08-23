const express = require ("express");
const webScraping = require ("../modules/scraping/webScraping");

const setupApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get("/scraping", async (req, res) => {
    await webScraping.webScraping();
    res.send("Scraping done!");
  });


  app.get("/", (req, res) => {
    res.send("Hello World!");

  });

  return app;
};

module.exports = setupApp;  


