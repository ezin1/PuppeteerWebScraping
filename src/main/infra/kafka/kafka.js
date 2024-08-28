const { Kafka } = require("kafkajs");

class KafkaProducer {
  constructor({ clientId, brokers, topic }) {
    this.kafka = new Kafka({ clientId, brokers });
    this.producer = this.kafka.producer();
    this.topic = topic;
  }

  async connect() {
    await this.producer.connect();
  }

  async sendMessage(message) {
    await this.producer.send({
      topic: this.topic,
      messages: [{ value: message }],
    });
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

module.exports = KafkaProducer;