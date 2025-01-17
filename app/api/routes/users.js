// Archivo relacionado al login, las consultas, los registers y todo lo que tenga que ver con el usuario.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { checkAuth } = require('../middlewares/authentication.js')

//models import
import User from '../models/user.js';
import EmqxAuthRule from "../models/emqx_auth.js";

/* 
  ___  ______ _____ 
 / _ \ | ___ \_   _|
/ /_\ \| |_/ / | |  
|  _  ||  __/  | |  
| | | || |    _| |_ 
\_| |_/\_|    \___/                                   
*/

// AUTH: LOGIN Y REGISTER, para este caso solo se usa el metodo POST. 
// No se usa get para el LOGIN porque no se quiere que se vea la contraseña en la URL. Ejemplo: www.google.com/search?password=1234

    // SI la consulta viene por POST ---> req.body
    // SI la consulta viene por GET ---> req.query

    // --REGISTER --
router.post('/register', async (req, res) => { 
    
    try {

        const password = req.body.password;
        const name = req.body.name;
        const email = req.body.email;
    
        const encryptedPassword = bcrypt.hashSync(password, 10); // 10 es el numero de veces que se va a encriptar la contraseña. Mientras mas veces se encripte, mas seguro es el password.
        
        const newUser = {
            name: name,
            email: email,
            password: encryptedPassword // se guarda la contraseña encriptada en la base de datos.
        }
    
        var user = await User.create(newUser); // se crea el usuario en la base de datos.
    
        const toSend = {
            "status": "success"
        }
        res.status(200).json(toSend); // 200 es un codigo de exito, es decir, la consulta se hizo correctamente.
        console.log(user);
        
    } catch (error) {
        console.log("ERROR - REGISTER ENDPOINT -")
        console.log(error);

        const toSend = {
            status: "failed",
            error: error
        }
        res.status(500).json(toSend); // 500 es un error interno del servidor, en la mayoria de los casos es porque hubo un error en la base de datos.
    }

});

// --LOGIN --
router.post('/login', async(req, res) => { 
    console.log(req.body)

    const email = req.body.email;
    const password = req.body.password;



    // Buscar el email en la base de datos si ya esta registrado.
    var user = await User.findOne({
        email: email
    })

// Si el usuario no existe o esta escrito incorrectamente, se envia un error.
if (!user) {
    const toSend = {
        status: "failed",
        error: "Invalid Credentials"
    }
    res.status(401).json(toSend); // 401 es un error de que no se encontraron las credenciales en la DB.
    return 
}

// Si el usuario existe, se compara la contraseña que se envio en el body con la contraseña que esta en la base de datos.
// Si es TRUE lo de arriba, entonces:
if (bcrypt.compareSync(password, user.password)) {
    user.set('password', undefined, {strict: false}) // se borra la contraseña del usuario para que no se envie al cliente.
    // Se crea un token para el usuario.
    const token = jwt.sign({userData: user}, 'securePasswordHere', {expiresIn: '24h'}); // el primer parametro es la informacion que se va a guardar en el token, el segundo parametro es la contraseña para encriptar el token, el tercer parametro es el tiempo de expiracion del token.

    // Se envia el token al cliente.
    const toSend = {
        status: "success",
        token: token,
        userData: user
    }
    return res.status(200).json(toSend); // 200 es un codigo de exito, es decir, la consulta se hizo correctamente.
    
} 
// Si puso bien el usuario pero mal la contraseña, se envia un error. Al igual que si puso mal el usuario.
else{
    const toSend = {
        status: "Invalid credentials",
        error: "ERROR"
    }
    return res.status(401).json(toSend);

}
});

//GET MQTT WEB CREDENTIALS
router.post("/getmqttcredentials", checkAuth,  async (req, res) => {

    try {
      const userId = req.userData._id;
  
      const credentials = await getWebUserMqttCredentials(userId);

      const toSend = {
        status: "success",
        username: credentials.username,
        password: credentials.password
      }
  
    res.json(toSend);
    
      setTimeout(() => {
        getWebUserMqttCredentials(userId);
      }, 10000);
  
    } catch (error) {
      console.log(error);
  
      const toSend = {
        status: "error"
      };
  
      return res.status(500).json(toSend);
    }
  
  
  
  });


//GET MQTT CREDENTIALS FOR RECONNECTION
router.post("/getmqttcredentialsforreconnection", checkAuth, async (req, res) => {

  const userId = req.userData._id;
  const credentials = await getWebUserMqttCredentialsForReconnection(userId);

  const toSend = {
    status: "success",
    username: credentials.username,
    password: credentials.password
  }

  console.log(toSend);
  res.json(toSend);

  setTimeout(() => {
    getWebUserMqttCredentials(userId);
  }, 15000);


});


/* 
______ _   _ _   _ _____ _____ _____ _____ _   _  _____ 
|  ___| | | | \ | /  __ \_   _|_   _|  _  | \ | |/  ___|
| |_  | | | |  \| | /  \/ | |   | | | | | |  \| |\ `--. 
|  _| | | | | . ` | |     | |   | | | | | | . ` | `--. \
| |   | |_| | |\  | \__/\ | |  _| |_\ \_/ / |\  |/\__/ /
\_|    \___/\_| \_/\____/ \_/  \___/ \___/\_| \_/\____/  
*/

async function getWebUserMqttCredentialsForReconnection(userId){

  try{
    const rule = await EmqxAuthRule.find({type: "user", userId: userId});

    if (rule.length == 1){
      const toReturn = {
        username: rule[0].username,
        password: rule[0].password
      }
      return toReturn;
    }

  }
  catch(error){
    console.log(error);
    return false;
  }

}

  // mqtt credential types: "user", "device", "superuser"
async function getWebUserMqttCredentials(userId){

    try {
      var rule = await EmqxAuthRule.find({ type: "user", userId: userId });
  
      if(rule.length == 0){
  
        const newRule = {
          userId: userId,
          username: makeid(10),
          password: makeid(10),
          publish: [userId + "/#"],
          subscribe: [userId + "/#"],
          type: "user",
          time: Date.now(),
          updatedTime: Date.now()
        }
  
      const result = await EmqxAuthRule.create(newRule);
  
      const toReturn = {
        username: result.username,
        password: result.password
      }
  
      return toReturn;
  
      }
  
      const newUserName = makeid(10);
      const newPassword = makeid(10);
  
      const result = await EmqxAuthRule.updateOne({type:"user", userId: userId}, {$set: {username: newUserName, password: newPassword, updatedTime: Date.now()}});
  
          // update response example
        //{ n: 1, nModified: 1, ok: 1 }
  
      if (result.n == 1 && result.ok == 1) {
          return {
              mqttUsername: newUserName,
              mqttPassword: newPassword
          }
      }else{
          return false;
      }
  
    } catch (error) {
      console.log(error);
      return false;
    }
  
  }
  
  
  function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  

// USER CRUD ---> CREATE, READ, UPDATE, DELETE (acciones que se pueden hacer con los usuarios)

module.exports = router;


 