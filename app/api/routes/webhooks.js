const express = require('express');
const router = express.Router();
const axios = require('axios');
const colors = require('colors');
var mqtt = require('mqtt');
const { checkAuth } = require('../middlewares/authentication.js');

import Data from '../models/data.js';
import Device from '../models/device.js';
import Notification from '../models/notifications.js';
import AlarmRule from '../models/emqx_alarm_rules.js';
import Template from '../models/template.js';
import EmqxAuthRule from '../models/emqx_auth.js';



var client;

const auth = {
    auth: {
        username: 'b360646eaf791e92',
        password: 'NCuEayvloVKwwPGlLpnRZavO1T1z9CgLu537kHLQDG9BI'
    }
  };

//DEVICE CREDENTIALS WEBHOOK
router.post("/getdevicecredentials", async (req, res) => {
    console.log(req.body);
  
    const dId = req.body.dId;
    console.log(dId);
    const password = req.body.password;
    const device = await Device.findOne({ dId: dId });
  
    if (password != device.password) {
        return res.status(401).json();
      }

   
    const userId = device.userId;
  
    var credentials = await getDeviceMqttCredentials(dId, userId);
  
    var template = await Template.findOne({ _id: device.templateId });
  
    console.log(template);
  
    var variables = [];
  
    template.widgets.forEach(widget => {
      
      var v = (({variable, variableFullName, variableType, variableSendFreq }) => ({
        variable,
        variableFullName,
        variableType,
        variableSendFreq
      }))(widget);
  
      variables.push(v);
    });
  
    const toSend = {
      username: credentials.username,
      password: credentials.password,
      topic: userId + "/" + dId + "/",
      variables: variables
    };
  
    console.log(toSend);
  
    res.json(toSend);
  
    setTimeout(() => {
      getDeviceMqttCredentials(dId, userId);
      console.log("Device Credentials Updated");
    }, 10000);
    
  });

router.post('/saver-webhook', async (req, res) => {
    // if (req.headers.token != "NCuEayvloVKwwPGlLpnRZavO1T1z9CgLu537kHLQDG9BI") {
    //     req.sendStatus(404);
    //     return;
    //   }
    console.log("Saver webhook received")
    const data = req.body;
    console.log(data);

    const splittedTopic = data.topic.split("/");
    const dId = splittedTopic[1];
    const userId = splittedTopic[0];
    const variable = splittedTopic[2];

    var result = await Device.find({ dId:dId , userId: userId});

    if (result.length == 1){
        Data.create({
          userId: userId,
          dId: dId,
          variable: variable,
          value: data.payload.value,
          time: Date.now()
        })
        console.log("Data created");
    }
  
    res.sendStatus(200);

    console.log(data);

    // res.json("{}");

});


router.post("/alarm-webhook", async (req, res) => {

    try {
        const incomingAlarm = req.body;
        console.log("ESTA ES LA REGLA QUE ENTRA:", incomingAlarm.emqxRuleId.yellow)
    
        updateAlarmCounter(incomingAlarm.emqxRuleId);
          
        console.log(incomingAlarm);

        const lastNotif = await Notification.find({ dId: incomingAlarm.dId, emqxRuleId: incomingAlarm.emqxRuleId }).sort({ time: -1 }).limit(1);
        console.log("ESTA ES LA ULTIMA NOTIFICACION",lastNotif.yellow);

        if (lastNotif == 0){
            console.log("FIRST TIME ALARM");
            saveNotifToMongo(incomingAlarm);
            sendMqttNotif(incomingAlarm);
          }else{
            
            const timestamp = Date.now(); // Esto está mal y causará el error que estás viendo
            const lastNotifToNowMins = ( timestamp - lastNotif[0].time ) / 1000 / 60; // Es la diferencia de tiempo entre la ultima notificacion y ahora... variable que guarda el tiempo transcurrido desde la ultima notificacion hasta ahora en minutos. 

            if (lastNotifToNowMins > incomingAlarm.triggerTime){
                console.log("TRIGGERED");
                saveNotifToMongo(incomingAlarm);
                sendMqttNotif(incomingAlarm);
            }


          }
        
        res.sendStatus(200);
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); // Indica que hubo un error en el servidor
    }

});

//GET NOTIFICATIONS
router.get("/notifications", checkAuth, async (req, res) => {

    try {
        const userId = req.userData._id;

        const notifications = await getNotifications(userId);
        

        

        const toSend = {
            status: "success",
            data: notifications
          };
        
          res.json(toSend);

    } catch (error) {

        console.log("ERROR GETTING NOTIFICATIONS");
        console.log(error)
    
        const toSend = {
          status: "error",
          error: error
        };

        return res.status(500).json(toSend);

    }

});

//UPDATE NOTIFICATION (readed status)
router.put("/notifications", checkAuth, async (req, res) => {

    try {
        const userId = req.userData._id;

        const notificationId = req.body.notifId;

        await Notification.updateOne({userId: userId, _id: notificationId},{readed: true});

        const toSend = {
            status: "success",
          };
        
          res.json(toSend);

    } catch (error) {

        console.log("ERROR UPDATING NOTIFICATION STATUS");
        console.log(error)
    
        const toSend = {
          status: "error",
          error: error
        };

        return res.status(500).json(toSend);

    }

});



/* 
______ _   _ _   _ _____ _____ _____ _____ _   _  _____ 
|  ___| | | | \ | /  __ \_   _|_   _|  _  | \ | |/  ___|
| |_  | | | |  \| | /  \/ | |   | | | | | |  \| |\ `--. 
|  _| | | | | . ` | |     | |   | | | | | | . ` | `--. \
| |   | |_| | |\  | \__/\ | |  _| |_\ \_/ / |\  |/\__/ /
\_|    \___/\_| \_/\____/ \_/  \___/ \___/\_| \_/\____/  
*/


function saveNotifToMongo(incomingAlarm) {
    // Crea un objeto nuevo con las propiedades necesarias para coincidir con tu esquema.
    const newNotif = {
        userId: incomingAlarm.userId,
        payload: incomingAlarm.payload,
        dId: incomingAlarm.dId,
        deviceName: incomingAlarm.deviceName,
        emqxRuleId: incomingAlarm.emqxRuleId,
        topic: incomingAlarm.topic,
        value: incomingAlarm.value,
        condition: incomingAlarm.condition,
        variable: incomingAlarm.variable,
        variableFullName: incomingAlarm.variableFullName, // Asegúrate de que esta propiedad exista en tu esquema si es necesaria.
        triggerTime: incomingAlarm.triggerTime, 
        readed: false,
        time: Date.now()
    };

    // Ahora, intenta crear la notificación con este nuevo objeto.
    Notification.create(newNotif, (error, doc) => {
        if (error) {
            console.error('Error saving notification to MongoDB', error);
        } else {
            console.log('Notification saved successfully', doc);
        }
    });
}


// async function updateAlarmCounter(emqxRuleId) {
  
//     try {
//        await AlarmRule.updateOne({ emqxRuleId: emqxRuleId }, { $inc: { counter: 1 } });
//     } catch (error) {
//         console.log(error)
//     }
// }


// async function getDeviceMqttCredentials(dId, userId) {
//   try {
//       var rule = await EmqxAuthRule.findOne({ type: "device", userId: userId, publish: { $regex: dId }});

//       if (rule) {
//           // If rule exists, return the existing credentials.
//           return {
//               username: rule.username,
//               password: rule.password
//           };
//       } else {
//           // If no rule exists, create a new one.
//           const newRule = {
//               userId: userId,
//               username: makeid(10),
//               password: makeid(10),
//               publish: [userId + "/" + dId + "/+/sdata"],
//               subscribe: [userId + "/" + dId + "/+/actdata"],
//               type: "device",
//               time: Date.now(),
//               updatedTime: Date.now()
//           };

//           const result = await EmqxAuthRule.create(newRule);

//           return {
//               username: result.username,
//               password: result.password
//           };
//       }
//   } catch (error) {
//       console.error(error);
//       return false;
//   }
// }


async function getDeviceMqttCredentials(dId, userId) {
  try {
    var rule = await EmqxAuthRule.findOne({
      type: "device",
      userId: userId,
      publish: { $regex: dId }
    });

    if (!rule) {
      const newRule = {
        userId: userId,
        username: makeid(10),
        password: makeid(10),
        publish: [userId + "/" + dId + "/+/sdata"],
        subscribe: [userId + "/" + dId + "/+/actdata"],
        type: "device",
        time: Date.now(),
        updatedTime: Date.now()
      };

      const result = await EmqxAuthRule.create(newRule);

      const toReturn = {
        username: result.username,
        password: result.password
      };

      return toReturn;
    }

    const newUserName = makeid(10);
    const newPassword = makeid(10);

    const result = await EmqxAuthRule.updateOne(
      { type: "device", publish: { $regex: dId } },
      {
        $set: {
          username: newUserName,
          password: newPassword,
          updatedTime: Date.now()
        }
      }
    );

    // update response example
    //{ n: 1, nModified: 1, ok: 1 }

    if (result.n == 1 && result.ok == 1) {
      return {
        username: newUserName,
        password: newPassword
      };
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}
async function updateAlarmCounter(emqxRuleId) {
    try {
        console.log("ESTE ES EL ID DE LA REGLA EN EMQX",emqxRuleId)
        const result = await AlarmRule.updateOne(
            { emqxRuleId: emqxRuleId },
            { $inc: { counter: 1 } }
        );
        console.log("Update result:", result);
    } catch (error) {
        console.error("Error updating alarm counter:", error);
    }
}

//GET ALL NOT READED NOTIFICATIONS
async function getNotifications(userId){
    try {
        const res = await Notification.find({userId: userId, readed: false});
        return res;
    } catch (error) {
        console.log(error);
        return false;     
    }
}

function sendMqttNotif(notif){
    const topic = notif.userId + '/dummy-did/dummy-var/notif';
    const msg = 'The rule: when the ' + notif.variableFullName + ' is ' + notif.condition + ' than ' + notif.value;
    client.publish(topic, msg);
}

function startMqttClient(){

    const options = {
        port: 1883,
        host: 'localhost',
        clientId: 'webhook_superuser' + Math.round(Math.random() * (0 - 10000) * -1),
        username: 'superuser',
        password: 'superuser',
        keepalive: 60,
        reconnectPeriod: 5000,
        protocolId: 'MQIsdp',
        protocolVersion: 3,
        clean: true,
        encoding: 'utf8'
    }

    client = mqtt.connect ('mqtt://' + 'localhost', options);

    client.on('connect', function () {
        console.log("MQTT CONNECTION -> SUCCESS;".green);
        console.log("\n");
    });

    client.on('reconnect', (error) => {
        console.log('RECONNECTING MQTT');
        console.log(error)
    });

    client.on('error', (error) => {
        console.log("MQTT CONNECIONT FAIL -> ");
        console.log(error)
    });


}

setTimeout(() => {
    startMqttClient();
}
, 3000);


function makeid(length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  setTimeout(() => {
    startMqttClient();
  }, 3000);





module.exports = router;



