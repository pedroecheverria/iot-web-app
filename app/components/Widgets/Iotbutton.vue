<template>
    <card>
        <div slot="header">
            <h4 class="card-title"> {{ config.selectedDevice.name }}- {{ config.variableFullName }}</h4>
        </div>

        <!-- <i class="fa" :class="[config.icon, geticonColorClass() ]"></i> -->
            <font-awesome-icon 
            :icon="['fas', config.icon]" 
            :class="getIconColorClass()" 
            style="font-size: 30px; height: 40px;"
            />

            <base-button @click="sendValue()" :type="config.class" class="mb-3 pull-right" size="lg">Add</base-button> 

    </card>
</template>

<script>
    import { fontawesome } from '@/plugins/fontawesome.js'
    export default{

        components:{
            fontawesome
        },
        props: ["config"], // Es lo que se recibe del campo, pero para simular en modo de desarrollo se opta por el de abajo:

        data(){
            return{ 
                //value:false, // Este es el valor que se cambia cuando llega un true para el mensaje para ese widget. (CLASE 98) es para el color del icono.
                sending: false,
            }
        },

        mounted(){
            
        },

        methods:{

            sendValue(){
                this.sending = true
                setTimeout(() => {
                    this.sending = false
                }, 1000);

                const toSend = {
                    topic: this.config.userId + "/" + this.config.selectedDevice.dId + "/" + this.config.variable + "/actdata",
                    msg: {
                        value: this.config.message
                    }
                }
                console.log(toSend)
                this.$nuxt.$emit('mqtt-sender', toSend) // Se emite un evento que se llama mqtt-sender y se envia el mensaje toSend. Emite eventos



            },

            getIconColorClass(){
                if(!this.sending){
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