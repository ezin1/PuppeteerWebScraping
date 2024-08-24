const express = require ("express");
const cron = require ("node-cron");
const webScraping = require ("../modules/scraping/webScraping");

const setupApp = () => {
  const app = express();
  app.use(express.json());
  
  app.get("/scraping", async (req, res) => {
    await webScraping.webScraping();
    res.send("Scraping done!");
  });

  cron.schedule("31 * * * *", async () => {
    await webScraping.webScraping();
  });

  app.get("/", (req, res) => {
    res.send("Hello World!");

  });

  return app;
};

module.exports = setupApp;  


