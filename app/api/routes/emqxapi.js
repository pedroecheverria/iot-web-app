// Es para cuando queremos conectarnos hacia EMQX para realizar acciones como realizar tareas de administración, crear reglas, publicar mensajes, suscribirse a mensajes, etc.
const express = require('express');
const axios = require('axios');
const colors = require('colors');


global.saverResource = null; // Variable global para guardar el recurso creado
global.alarmResource = null; // Variable global para guardar el recurso creado

// Configuración de autenticación
const auth = {
    auth: {
        username: 'b360646eaf791e92',
        password: 'NCuEayvloVKwwPGlLpnRZavO1T1z9CgLu537kHLQDG9BI'
    }
};

async function listResources() {
    try {
        const url = "http://localhost:18083/api/v5/bridges";

        const res = await axios.get(url, auth);

            console.log('Respuesta recibida:'.yellow, res.data); //si la estructura de la respuesta es res.data solamente.
            console.log('Total de recursos:'.green,  res.data.length);
            const size = res.data.length;
        
        if (res.status == 200) { // Si la respuesta a la API de EMQX es exitosa, entonces:
            if (size == 0){
                console.log("***** Creating emqx webhook resources *****".green)
        
                createResources();
            }else if (size == 2){
        
                res.data.forEach(resource => {
        
                    if(resource.name == "Alarms_WH_D"){
                        global.alarmResource = resource;
        
                        console.log("▼ ▼ ▼ ALARM RESOURCE FOUND ▼ ▼ ▼ ".bgMagenta);
                        console.log(global.alarmResource);
                        console.log("▲ ▲ ▲ ALARM RESOURCE FOUND ▲ ▲ ▲ ".bgMagenta);
                        console.log("\n");
                        console.log("\n");
                    }
        
                    if(resource.name == "Saver_WH_D"){
                        global.saverResource = resource;
        
                        console.log("▼ ▼ ▼ SAVER RESOURCE FOUND ▼ ▼ ▼ ".bgMagenta);
                        console.log(global.saverResource);
                        console.log("▲ ▲ ▲ SAVER RESOURCE FOUND ▲ ▲ ▲ ".bgMagenta);
                        console.log("\n");
                        console.log("\n");
                    }
            
        
                });
            }else{
        
                function printWarning() {
                    console.log("DELETE ALL WEBHOOK EMQX RESOURCES AND RESTART NODE - youremqxdomain:18083/#/resources".red);
                    setTimeout(() => {
                        printWarning();
                    }, 1000);
                }
        
                printWarning();
            }

            
        }else{
            console.log("Error in EMQX API".red);
        }

    } catch (error) {
        console.error('Error listing EMQX resources:'.red, error.message);
    }
}

// CREATE RESOURCES:
async function createResources() {

    try {
        const url = "http://localhost:18083/api/v5/bridges";

        const data1 = {
            connect_timeout: "15s",
            enable: true,
            enable_pipelining: 100,
            local_topic: "emqx_webhook/#",
            body: "${payload}",
            max_retries: 3,
            method: "post",
            name: "Saver_WH_D",
            pool_size: 4,
            pool_type: "random",
            request_timeout: "15s",
            resource_opts: {
                health_check_interval: 15000,
                inflight_window: 100,
                max_buffer_bytes: 104857600,
                query_mode: "async",
                worker_pool_size: 1
            },
            ssl: {
                enable: false
              },

            type: "webhook",
            url: "http://localhost:3001/api/saver-webhook"       
        }


        const data2 = {
            connect_timeout: "15s",
            enable: true,
            enable_pipelining: 100,
            local_topic: "emqx_webhook/#",
            max_retries: 3,
            method: "post",
            body: "${payload}",
            name: "Alarm_WH_D",
            pool_size: 4,
            pool_type: "random",
            request_timeout: "15s",
            resource_opts: {
                health_check_interval: 15000,
                inflight_window: 100,
                max_buffer_bytes: 104857600,
                query_mode: "async",
                worker_pool_size: 1
            },
            ssl: {
                "enable": false
              },

            type: "webhook",
            url: "http://localhost:3001/api/alarm-webhook"   
        }

        const res1 = await axios.post(url, data1, auth);
        if (res1.status == 200) {
            console.log("Saver resource created".green);
        }
    
        const res2 = await axios.post(url, data2, auth);
        if (res2.status == 200) {
            console.log("Alarm resource created".green);
        }
    
    // Ejecutar la función después de un retraso para dar tiempo a que el servidor EMQX se inicie
        setTimeout(() => {
            console.log("***** EMQX webhook created! *****".green)
            listResources();
        }, 1000);
        
        
    } catch (error) {
        console.error('Error creating EMQX resources:'.red, error.message);
        
    }


}

setTimeout(() => {
    listResources();
}, 1000);







module.exports = express.Router(); // No hay necesidad de asignar a una variable si no la usas
