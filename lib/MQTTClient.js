const EventEmitter = require('events');
const mqtt = require('mqtt');

class MQTTClient extends EventEmitter {
  constructor(config, log) {
    super()
    this.log = log;
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
        const conversion = config.tempConversion ? eval(config.tempConversion) : parseFloat;
        try {
          let temperature = conversion(message);
          if (isNaN(temperature)) {
            temperature = undefined;
          }
          this.log("Message: " + message + " -> " + temperature);
          this.emit('temperatureChange', temperature)
        } catch (err) {
          this.log("ERROR: " + err + " - (" + config.tempConversion + ")");
        }

      } else if (topic === config.topicHumi) {
        const humidity = parseInt(message);
        this.emit('humidityChange', humidity)
      }
    });
  }
}

module.exports = { MQTTClient };