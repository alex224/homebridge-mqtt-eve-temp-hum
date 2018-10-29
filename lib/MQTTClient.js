const EventEmitter = require('events');
const mqtt = require('mqtt');

class MQTTClient extends EventEmitter {
  constructor(config) {
    super()
    this.mqtt = mqtt.connect(config.url, {
      keepalive: 10,
      clientId: 'mqttjs_'.concat(Math.random().toString(16).substr(2, 8)),
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false,
      },
      username: config.username,
      password: config.password,
      rejectUnauthorized: false
    });
  
    this.mqtt.on('connect', () => {
      this.emit('connected', null)
      if (config.topic) {
        this.mqtt.subscribe(config.topic);
      }
      if (config.topicTemp) {
        this.mqtt.subscribe(config.topicTemp);
      }
      if (config.topicHumi) {
        this.mqtt.subscribe(config.topicHumi);
      }
    });
  
    this.mqtt.on('message', (topic, message) => {
      if (topic === config.topicGet) {
        const mqttData = JSON.parse(message)
        if (mqttData === null) return
          
        const temperature = parseFloat(mqttData.temperature);
        const humidity = parseInt(mqttData.humidity);

        this.emit('temperatureChange', temperature)
        this.emit('humidityChange', humidity)
        
      } else if (topic === config.topicTemp) {
        const temperature = parseFloat(message);
        this.emit('temperatureChange', temperature)

      } else if (topic === config.topicHumi) {
        const humidity = parseInt(mqttData.humidity);
        this.emit('humidityChange', humidity)
      }
    });
  }
}

module.exports = { MQTTClient };