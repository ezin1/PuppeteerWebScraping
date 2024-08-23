const setupApp = require("./config/app");

const app = setupApp();

const server = app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});

module.exports = server;

