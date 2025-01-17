<template>
    <card>
        <div slot="header">
            <h4 class="card-title"> {{ config.selectedDevice.name }}- {{ config.variableFullName }}</h4>
        </div>

        <!-- <i class="fa" :class="[config.icon, geticonColorClass() ]"></i> -->
            <font-awesome-icon :icon="['fas', config.icon]" :class="getIconColorClass()" style="font-size: 30px; height: 20px;"/>

    </card>
</template>

<script>
    import { fontawesome } from '@/plugins/fontawesome.js'
    export default{

        components:{
            fontawesome
        },
        props: ['config'], //Es lo que se recibe del campo, pero para simular en modo de desarrollo se opta por el de abajo:
        data(){
            return{
                value: false // Este es el valor que se cambia cuando llega un true para el mensaje para ese widget. (CLASE 98) es para el color del icono.
                // config:{
                //    userId: 'userid',
                //    slectedDevice:{ // selector que contiene TODOS los dispositovos del dashboard. 
                //     name: "Sala Principal",
                //     dId: "892",
                //     templateName: "Sensores de Resistividad", // Cada vez que el usuario elija este nombre de plantilla, le muestra un dashboard de ese tipo. 
                //     templateId: "1234234324",
                //     saverRule: false // Si es false, no se guarda en la base de datos. Si es true, se guarda en la base de datos.
                //    },
                //    variableFullName: "Pump",
                //    variable: "var1",
                //    icon: "sun",
                //    column: 'col-6', // medida del card que el usuario puso en el dashboard. solo es un supuesto ya que esto deberia ser dinamico. 
                //    widget:'indicator', 
                //    class: 'success' // el usuario elige el color del icono de la base de datos por ej. lo que pasaba con text-success o dark 

                // }
            }
        },

        mounted(){
            //  //userId/dId/uniquestr/sdata  ---> Formato que tendra nuestro topic
            const topic = this.config.userId + "/" + this.config.selectedDevice.dId + "/" + this.config.variable + "/sdata" // Se crea el topic con el que se va a suscribir
            console.log(topic)
            // Cuando carga toda la pagina, se empieza a escuchar con el siguiente codigo:
            this.$nuxt.$on('topic', this.processReceivedData) // Se suscribe a un evento que se llama widget-topic y cuando llega un mensaje, se ejecuta la funcion processReceivedData. Escucha eventos
        },

        methods:{

            processReceivedData(data){
                console.log("received")
                console.log(data)
                this.value = data.value // Cuando llega un mensaje, se cambia el valor de value.


            },

            getIconColorClass(){
                if(!this.value){
                    return "text-dark"
                }

                if(this.config.class == 'success'){
                    return "text-success"
                }
                if(this.config.class == 'primary'){
                    return "text-primary"
                }
                if(this.config.class == 'danger'){
                    return "text-danger"
                }
                if(this.config.class == 'warning'){
                    return "text-warning"
                }


                
            }
        }

        
    }
</script>