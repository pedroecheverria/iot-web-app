const express = require("express");
const router = express.Router();
const axios = require("axios");

const { checkAuth } = require('../middlewares/authentication.js')


/*
 ___  ______________ _____ _      _____ 
|  \/  |  _  |  _  \  ___| |    /  ___|
| .  . | | | | | | | |__ | |    \ `--. 
| |\/| | | | | | | |  __|| |     `--. \
| |  | \ \_/ / |/ /| |___| |____/\__/ /
\_|  |_/\___/|___/ \____/\_____/\____/  
*/
import Device from '../models/device.js';
import SaverRule from '../models/emqx_saver_rule.js';
import Template from '../models/template.js';
import AlarmRule from '../models/emqx_alarm_rules.js';



/* 
  ___  ______ _____ 
 / _ \ | ___ \_   _|
/ /_\ \| |_/ / | |  
|  _  ||  __/  | |  
| | | || |    _| |_ 
\_| |_/\_|    \___/ 
*/

// GET DEVICES
router.get("/device", checkAuth ,async(req, res) => {

  try {
    const userId = req.userData._id; // viene del middleware checkAuth. Es el id del usuario que hizo la petición.
    // get devices from mongoDB
    var devices = await Device.find({ userId: userId }); // Busca todos los dispositivos del usuario. O sea, filtra por userId.
    devices = JSON.parse(JSON.stringify(devices)); // Convierte el objeto a JSON para poder agregarle el saverRule.

    // get saver rules from mongoDB
    const saverRules = await getSaverRules(userId);

    // get saver templates from mongoDB
    const templates = await getTemplates(userId);

    //get alarm rules
    const alarmRules = await getAlarmRules(userId);


    devices.forEach((device, index) => {
      devices[index].saverRule = saverRules.filter(saverRule => saverRule.dId == device.dId)[0];
      devices[index].template = templates.filter(template => template._id == device.templateId)[0];
      devices[index].alarmRules = alarmRules.filter(alarmRule => alarmRule.dId == device.dId);

    });

      const toSend = {
        status: "success",
        data: devices
      };
      res.json(toSend);
  } catch (error) {
    console.log("ERROR GETTING DEVICES");
    const toSend = {
      status: "error",
      error: error
    }
  
    return res.status(500).json(toSend);
    
  }


 

});



// CREATE NEW DEVICE AND SAVER RULE
router.post("/device", checkAuth, async (req, res) => {
  try {
    console.log(req.body)
    const userId = req.userData._id;
    var newDevice = req.body.newDevice;

    newDevice.userId = userId;

    newDevice.createdTime = Date.now();

    newDevice.password = makeid(10);

    await createSaverRule(userId, newDevice.dId, true);

    const device = await Device.create(newDevice);

    await selectDevice(userId, newDevice.dId);

    const toSend = {
      status: "success"
    };

    return res.json(toSend);
  } catch (error) {
    console.log("ERROR CREATING NEW DEVICE");
    console.log(error);

    const toSend = {
      status: "error",
      error: error
    };

    return res.status(500).json(toSend);
  }
});
//DELETE DEVICE
router.delete("/device", checkAuth, async(req, res) => {

  try {
    const userId = req.userData._id;
    const dId = req.query.dId;

    await deleteSaverRule(dId); // delete saver rule from emqx and mongoDB

    const result = await Device.deleteOne({userId: userId, dId: dId}); // delete device from mongoDB

        //devices after deletion
        const devices = await Device.find({ userId: userId });

        if (devices.length >= 1) {
          //any selected?
          var found = false;
          devices.forEach(devices => {
            if (devices.selected == true) {
              found = true;
            }
          });
    
          //if no selected...
          //we need to selet the first
          if (!found) {
            await Device.updateMany({ userId: userId }, { selected: false });
            await Device.updateOne(
              { userId: userId, dId: devices[0].dId },
              { selected: true }
            );
          }
        }
    
        const response = {
          status: "success",
          data: result
        };
    
        return res.json(response);
      } catch (error) {
        console.log("ERROR DELETING DEVICE");
        console.log(error);
    
        const response = {
          status: "error",
          error: error
        };
    
        return res.status(500).json(response);
      }
    });
  
// IBA ABAJO DEL const result = await Device.deleteOne({ userId: userId, dId: dId });
//     const toSend = {
//       status: "success",
//       data: result
//     };
  
//     return res.json(toSend);
    
//   } catch (error) {

//     console.log("ERROR DELETING DEVICE");
//     console.log(error);

//     const toSend = {
//       status: "error",
//       error: error
//     };

//     return res.status(500).json(toSend);
//   }



// });

//UPDATE DEVICE (SELECTOR)
router.put("/device", checkAuth, async (req, res) => {
  
  const dId = req.body.dId;
  const userId = req.userData._id;

  if (await selectDevice(userId, dId)) {
    const toSend = {
      status: "success"
    };

    return res.json(toSend);
  } else {
    const toSend = {
      status: "error"
    };

    return res.json(toSend);
  }
});

//SAVER-RULE STATUS UPDATER
router.put('/saver-rule', checkAuth, async (req, res) => {

  
  const rule = req.body.rule; // Recibimos la regla desde el front-end, pero la regla copiada 'ruleCopy'

  console.log(rule)

  await updateSaverRuleStatus(rule.emqxRuleId, rule.status)

  const toSend = {
    status: "success"
  };

  res.json(toSend);
  

});


/* 
______ _   _ _   _ _____ _____ _____ _____ _   _  _____ 
|  ___| | | | \ | /  __ \_   _|_   _|  _  | \ | |/  ___|
| |_  | | | |  \| | /  \/ | |   | | | | | |  \| |\ `--. 
|  _| | | | | . ` | |     | |   | | | | | | . ` | `--. \
| |   | |_| | |\  | \__/\ | |  _| |_\ \_/ / |\  |/\__/ /
\_|    \___/\_| \_/\____/ \_/  \___/ \___/\_| \_/\____/  
*/
// setTimeout(() => {
//   createSaverRule("p3d9r098","9087",false);
//   }, 2000);

const auth = {
  auth: {
      username: 'b360646eaf791e92',
      password: 'NCuEayvloVKwwPGlLpnRZavO1T1z9CgLu537kHLQDG9BI'
  }
};


async function getAlarmRules(userId) {

  try {
      const rules = await AlarmRule.find({ userId: userId });
      return rules;
  } catch (error) {
      return "error";
  }

}

async function selectDevice(userId, dId) {
  try {
    const result = await Device.updateMany(
      { userId: userId },
      { selected: false }
    );

    const result2 = await Device.updateOne(
      { dId: dId, userId: userId },
      { selected: true }
    );

    return true;

  } catch (error) {
    console.log("ERROR IN 'selectDevice' FUNCTION ");
    console.log(error);
    return false;
  }
}

/*
 SAVER RULES FUNCTIONS
*/

//get templates
async function getTemplates(userId) {
  try {
    const templates = await Template.find({ userId: userId });
    return templates;
  } catch (error) {
    return false;
  }
} 

  //create saver rule
async function createSaverRule(userId, dId, status) {
  
  try {
    console.log("UserId received in createSaverRule:", userId);
      const url = "http://localhost:18083/api/v5/rules";

      const topic = userId + "/" + dId + "/+/sdata";

      var newRule = {
        
          "sql": "SELECT topic, payload FROM \"" + topic + "\" WHERE payload.save = 1",
          actions: [
            "webhook:Saver_WH_D",
            {
              args: {
                "payload": '{"userId":"' + userId + '","payload":${payload},"topic":"${topic}"}',
                "topic": "${topic}",

              },
            "function": "republish",
            },
            {
              "function": "console"
            }  
          ],
          $resource: global.saverResource.id,
          enable: status,
          description: "SAVER-RULE",
  
      }
      //save rule in emqx:
      const res = await axios.post(url, newRule, auth);
  
      if(res.status == 201 && res.data){
        console.log(res.data);
        
  
        await SaverRule.create({
          userId: userId,
          dId: dId,
          emqxRuleId: res.data.id,
          status: status
        });
  
        return true;
  
      }else{
        return false;
      }
      
    } catch (error) {
      console.log("ERROR CREATING SAVER RULE");
      console.log(error);
      
    }


  
}



  //get saver rules: we're going to get the devices from MongoDB
  async function getSaverRules(userId) {
    try {
      const rules = await SaverRule.find({userId: userId});
      return rules;
    } catch (error) {
      console.log("ERROR GETTING SAVER RULES");
      return false;
    }
    
  }

  // update rules:
  async function updateSaverRuleStatus(emqxRuleId, status) {
    try {
      const url = "http://localhost:18083/api/v5/rules/" + emqxRuleId;
  
      const newRule = {
        enable: status
      };
  
      const res = await axios.put(url, newRule, auth);
  
      if (res.status === 200 && res.data) {
        await SaverRule.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
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
  

//delete saver rule
async function deleteSaverRule(dId) {
  try {
    const mongoRule = await SaverRule.findOne({ dId: dId });

    const url = "http://localhost:18083/api/v5/rules/" + mongoRule.emqxRuleId;

    const emqxRule = await axios.delete(url, auth);

    const deleted = await SaverRule.deleteOne({ dId: dId });

    return true;
  } catch (error) {
    console.log("Error deleting saver rule");
    console.log(error);
    return false;
  }
}

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

module.exports = router;