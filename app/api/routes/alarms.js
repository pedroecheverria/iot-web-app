const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkAuth } = require('../middlewares/authentication.js');
const colors = require('colors');


import { update } from 'tween.js';
import AlarmRule from '../models/emqx_alarm_rules.js';

const auth = {
    auth: {
        username: 'b360646eaf791e92',
        password: 'NCuEayvloVKwwPGlLpnRZavO1T1z9CgLu537kHLQDG9BI'
    }
  };
  

/* 
  ___  ______ _____ 
 / _ \ | ___ \_   _|
/ /_\ \| |_/ / | |  
|  _  ||  __/  | |  
| | | || |    _| |_ 
\_| |_/\_|    \___/                                   
*/

//CREATE ALARM-RULE
router.post('/alarm-rule', checkAuth, async (req, res) => {

    var newRule = req.body.newRule;
    newRule.userId = req.userData._id;

    var r = await createAlarmRule(newRule);

    if (r) {

        const response = {
            status: "success",
        }

        return res.json(response);

    } else {
        const response = {
            status: "error",
        }

        return res.status(500).json(response);
    }

});

//UPDATE ALARM-RULE STATUS
router.put('/alarm-rule', checkAuth, async (req, res) => {

try {

    var rule = req.body.rule;
    console.log("ESTA ES LA RULE:", rule);
    var r = await updateAlarmRuleStatus(rule.emqxRuleId, rule.status);
    console.log("ESTE ES EL R:", r);
    if (r) {

        const response = {
            status: "success",
        }

        return res.json(response);

    } else {
        const response = {
            status: "error",
        }

        return res.status(500).json(response);
    }
  

    
} catch (error) {
    console.log(error);
    
    
}

});

//DELETE ALARM-RULE
router.delete('/alarm-rule', checkAuth, async (req, res) => {

  var emqxRuleId = req.query.emqxRuleId;

  var r = await deleteAlarmRule(emqxRuleId);

  if (r ) {

      const response = {
          status: "success",
      }

      return res.json(response);

  } else {
      const response = {
          status: "error",
      }

      return res.json(response);
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

//CREATE ALARM
async function createAlarmRule(newAlarm) {

    const url = "http://localhost:18083/api/v5/rules";
    console.log("NewAlarmRule:", newAlarm.yellow);

    // topicExample = userid/did/temp  //msgExample = {value: 20}
    const topic = newAlarm.userId + "/" + newAlarm.dId + "/" + newAlarm.variable + "/sdata";
    console.log("topic:", topic.green)

    const rawsql = "SELECT username, topic, payload FROM \"" + topic + "\" WHERE payload.value "  + newAlarm.condition + " " + newAlarm.value + " AND is_not_null(payload.value)";

    var newRule = {
        
        "sql": rawsql,
        actions: [
          "webhook:Alarm_WH_D",
          {
            args: {
              "payload": '{"userId":"' + newAlarm.userId + '","payload":${payload},"topic":"${topic}"}',
              "topic": "${topic}",
            },
          "function": "republish", 
          args: {
            "payload": '{"userId":"' + newAlarm.userId + '","payload":${payload},"topic":"${topic}"}',
            "topic": "t/1" ,
          },
          },
          {
            "function": "console"
          }  
        ],
        $resource: global.saverResource.id,
        enable: newAlarm.status,
        description: "ALARM-RULE",

    }

    //save rule in emqx - grabamos la regla en emqx
    const res = await axios.post(url, newRule, auth);
    const emqxRuleId = res.data.id;
    console.log("data:",res.data);


    if (res.data && res.status === 201) {

        //save rule in mongo -- grabamos regla en mongos
        const mongoRule = await AlarmRule.create({
            userId: newAlarm.userId,
            dId: newAlarm.dId,
            emqxRuleId: emqxRuleId ,
            status: newAlarm.status,
            variable: newAlarm.variable,
            variableFullName: newAlarm.variableFullName,
            value: newAlarm.value,
            condition: newAlarm.condition,
            triggerTime: newAlarm.triggerTime,
            createTime: Date.now()
        });
        

        const url = "http://localhost:18083/api/v5/rules/" + mongoRule.emqxRuleId;
       

        newRule.actions[1].args.payload = '{"userId":"' + newAlarm.userId + '","dId":"' + newAlarm.dId + '","deviceName":"' + newAlarm.deviceName + '","payload":${payload},"topic":"${topic}","emqxRuleId":"' + mongoRule.emqxRuleId + '","value":' + newAlarm.value + ',"condition":"' + newAlarm.condition + '","variable":"' + newAlarm.variable + '","variableFullName":"' + newAlarm.variableFullName + '","triggerTime":' + newAlarm.triggerTime + '}';

        const res = await axios.put(url, newRule, auth);
        // // const payload = '{"userId":"' + newAlarm.userId + '","dId":"' + newAlarm.dId + '","payload":${payload},"topic":"${topic}","emqxRuleId":"' + mongoRule.emqxRuleId + '","value":' + newAlarm.value + ',"condition":"' + newAlarm.condition + '","variable":"' + newAlarm.variable + '","variableFullName":"' + newAlarm.variableFullName + '","triggerTime":' + newAlarm.triggerTime + '}';
        
        
        newRule.actions[1].args.payload = "${payload}";
    

        console.log(res.data)
        
        console.log("New Alarm Rule Updated:", JSON.stringify(res.data).yellow);
        
        console.log("New Alarm Rule Created...".green);
        return true;
        

    }

}

//UPDATE ALARM STATUS
async function updateAlarmRuleStatus(emqxRuleId, status) {

    try {
        const url = "http://localhost:18083/api/v5/rules/" + emqxRuleId;
    
        const newRule = {
          enable: status
        };
    
        const res = await axios.put(url, newRule, auth);
        console.log(" ESTE ES EL status:", res.status);
        if (res.status === 200 && res.data) {
          await AlarmRule.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
          console.log("Saver Rule Status Updated...".green);
          return {
            status: "success",
            action: "updated"
          };
        } else {
          console.log("Failed to update Saver Rule Status.".red);
          return {
            status: "error",
            action: "failed",
            message: `Unexpected status code: ${res.status}`
          };
        }
      } catch (error) {
        console.error("Error updating Saver Rule Status:".red, error.response ? error.response.data : error.message);
        console.error("Error updating Saver Rule Status:".red, error.message);
        return {
          status: "error",
          action: "failed",
          message: error.response ? error.response.data : "An unknown error occurred"
        };
      }
    }

async function deleteAlarmRule(emqxRuleId) {
  try {

      const url = "http://localhost:18083/api/v5/rules/" + emqxRuleId;

      const emqxRule = await axios.delete(url, auth);

      const deleted = await AlarmRule.deleteOne({ emqxRuleId: emqxRuleId });

      return true;

  } catch (error) {

      console.log(error);
      return false;

  }
}

module.exports = router;