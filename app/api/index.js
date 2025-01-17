// requires
const express = require('express');
const morgan = require('morgan'); // se usa para ver las peticiones que se hacen a la API y no estar poniendo un console.log cada vez que se hace una petición
const cors = require('cors'); // se usa para cuando queremos que nuestra API sea consumida por otros servidores
const mongoose = require('mongoose'); // se usa para conectarnos a MongoDB
const colors = require('colors');

// initializations
const app = express();

//express config
app.use(morgan('tiny')); 
app.use(express.json()); // para que express pueda entender los datos que le enviamos desde el cliente
app.use(express.urlencoded({extended: true})); // lo que hace es que si el cliente usa parametros en la URL del navegador, express pueda entenderlos. Por ejemplo: localhost:3000/?name=Juan&age=20&....
app.use(cors()); 

// express routes
app.use('/api', require('./routes/devices.js'));
app.use('/api', require('./routes/users.js'));
app.use('/api', require('./routes/templates.js'));
app.use('/api', require('./routes/webhooks.js'));
app.use('/api', require('./routes/emqxapi.js'));
app.use('/api', require('./routes/alarms.js'));
app.use('/api', require('./routes/records.js'));
app.use('/api', require('./routes/dataprovider.js'));


module.exports = app;


//listener
app.listen(3001, () => {
    console.log('Server on port 3001'.green);
});


// MongoDB connection
const mongoUserName = 'mypharmadb';
const mongoPassword = 's3rv3r_t3s1s';
const mongoHost = 'localhost';
const mongoPort = '27017';
const mongoDatabase = 'mypharmadbc';

var uri = "mongodb://" + mongoUserName + ":" + mongoPassword + "@" + mongoHost + ":" + mongoPort + "/" + mongoDatabase;

const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    authSource: 'admin'
};

try {
    mongoose.connect(uri, options).then(()=>{
        console.log("\n")
        console.log("************************************************************".green)
        console.log('MongoDB is connected'.green);
        console.log("************************************************************".green)
        console.log("\n")
    
    }, 
    
    (err)=>{
        console.log("\n")
        console.log("************************************************************".red)
        console.log('MongoDB connection unsuccessful'.red);
        console.log("************************************************************".red)
        console.log("\n")
        console.log(err);
            }
    );
    
} catch (error) {
    console.log('ERROR CONNECTING MongoDB'.red);
    console.log(error);
}

