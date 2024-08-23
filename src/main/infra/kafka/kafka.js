const kafka = require("kafkajs");

const kafkaConfig = {
  clientId: "api",
  brokers: ["localhost:9092"],
};

async function producer() {
  const kafka = new kafka.Kafka(kafkaConfig);
  const producer = kafka.producer();

  await producer.connect();

  return producer;
}

module.exports = { producer };
