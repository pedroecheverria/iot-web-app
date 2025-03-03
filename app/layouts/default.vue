<template>
  
  <div class="wrapper" :class="{ 'nav-open': $sidebar.showSidebar }">

    <notifications></notifications>

    <side-bar
      :background-color="sidebarBackground"
      short-title="PM"
      title="Sentil IoT"
    >
      <template slot-scope="props" slot="links">

        <sidebar-item
          :link="{
            name: 'Dashboard',
            icon: 'tim-icons icon-chart-bar-32',
            path: '/dashboard'
          }"
        ></sidebar-item>

        <sidebar-item
          :link="{
            name: 'Devices',
            icon: 'tim-icons icon-atom',
            path: '/devices'
          }"
        ></sidebar-item>

        <sidebar-item
          :link="{
            name: 'Alarm Setup',
            icon: 'tim-icons icon-bell-55',
            path: '/alarms'
          }"
        ></sidebar-item>

        <sidebar-item
          :link="{
            name: 'Alarm Records',
            icon: 'tim-icons icon-notes',
            path: '/alarm-records'
          }"
        ></sidebar-item>

        <sidebar-item
          :link="{
            name: 'Data Records',
            icon: 'tim-icons icon-book-bookmark',
            path: '/data-records'
          }"
        ></sidebar-item>


        <sidebar-item
          :link="{
            name: 'Templates',
            icon: 'tim-icons icon-puzzle-10',
            path: '/templates'
          }"
        ></sidebar-item>



        <!-- ...Dashboard es la seccion donde se muestran los graficos de los sensores ... -->
        <!-- ...Devices es la seccion donde el usuario o cliente agrega o da de alta dispositivos ... -->
        <!-- ... Alarms es la seccion donde se le notifica al usuario sobre ciertas alarmas que ocurren en planta. Por ej: un sensor arroja un valor fuera del umbral ... -->
        <!-- ... Templates es la seccion donde el usuario puede crear plantillas de dispositivos, es decir, donde pueden hacer su propio dashboard... -->


      </template>

    </side-bar>

      <!-- ... sidebar-share es el componente que se encarga de cambiar el color del sidebar, es decir, el color de fondo del sidebar. (LINEA 58 NO FUNCIONA) -->
      <sidebar-share :background-color.sync="sidebarBackground"></sidebar-share> 

      


    <div class="main-panel" :data="sidebarBackground">
      <dashboard-navbar></dashboard-navbar>
      <router-view name="header"></router-view>

      <div 
        :class="{ content: !isFullScreenRoute }"
        @click="toggleSidebar"
      >

        <zoom-center-transition :duration="800" mode="out-in">
          
          <nuxt></nuxt>
        </zoom-center-transition>
      </div>
      <content-footer v-if="!isFullScreenRoute"></content-footer>
    </div>

  </div>
</template>

<script>

import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import SidebarShare from '@/components/layout/SidebarSharePlugin.vue'
import mqtt from "mqtt";
import Iotbutton from '@/components/Widgets/Iotbutton.vue'
import DashboardNavbar from "@/components/Layout/DashboardNavbar.vue";
import ContentFooter from "@/components/Layout/ContentFooter.vue";
import DashboardContent from "@/components/Layout/Content.vue";
import { SlideYDownTransition, ZoomCenterTransition } from "vue2-transitions";

function hasElement(className) {
  return document.getElementsByClassName(className).length > 0;
}

function initScrollbar(className) {
  if (hasElement(className)) {
    new PerfectScrollbar(`.${className}`);
  } else {
    // try to init it later in case this component is loaded async
    setTimeout(() => {
      initScrollbar(className);
    }, 100);
  }
}
export default {
  name: 'DefaultLayout',

  data() {
    return {
      sidebarBackground: 'blue',
      client: null,
      options : {
        host: "localhost",
        port: 8083,
        endpoint: "/mqtt",
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 5000,

        // Certification Information
        clientId: "web_" + this.$store.state.auth.userData.name + "_" + Math.floor(Math.random() * 1000000 + 1),
        username: "",
        password: ""
      }
    }
  },
  middleware: "authenticated",

  components: {
    // SidebarShare: () => import('@/components/layout/SidebarSharePlugin.vue'),
    // DashboardNavbar: () => import('@/components/layout/DashboardNavbar.vue'),
    // ZoomCenterTransition,
    // ContentFooter: () => import('@/components/layout/ContentFooter.vue'),
    DashboardNavbar,
    ContentFooter,
    DashboardContent,
    SlideYDownTransition,
    ZoomCenterTransition,
    SidebarShare,
    Iotbutton
  },

  computed: {
    isFullScreenRoute() {
      return this.$route.meta.fullScreen
    }
  },
  mounted() {
    this.initScrollbar();
    this.$store.dispatch("getNotifications");

    setTimeout(() => {
      this.startMqttClient();
    }, 2000);
    
  },

  methods: {
    async getMqttCredentials() {
      try {

        const axiosHeaders = {
          headers: {
            token: this.$store.state.auth.token
          }
        };

        const credentials = await this.$axios.post("/getmqttcredentials", null ,axiosHeaders);
        console.log(credentials.data)

        if(credentials.data.status=="success"){
          this.options.username = credentials.data.username;
          this.options.password = credentials.data.password;
        }


      } catch (error) {
        console.log(error);
        
        if (error.response.status == 401) {
          console.log("NO VALID TOKEN");
          localStorage.clear();
          window.location.href = "/login";
        }
      }
},

async getMqttCredentialsForReconnection() {
      try {
        const axiosHeaders = {
          headers: {
            token: this.$store.state.auth.token
          }
        };

        const credentials = await this.$axios.post(
          "/getmqttcredentialsforreconnection",
          null,
          axiosHeaders
        );
        console.log(credentials.data);

        if (credentials.data.status == "success") {
          this.client.options.username = credentials.data.username;
          this.client.options.password = credentials.data.password;
        }

      } catch (error) {
        console.log(error);
      }
    },


    async startMqttClient() {

      await this.getMqttCredentials();
    
      //ex topic: "userid/did/variableId/sdata"
      const deviceSubscribeTopic = this.$store.state.auth.userData._id + "/+/+/sdata";
      const notifSubscribeTopic = this.$store.state.auth.userData._id + "/+/+/notif";

      const connectUrl = "ws://" + this.options.host + ":" + this.options.port + this.options.endpoint;

      try {
        this.client = mqtt.connect(connectUrl, this.options);
      } catch (error) {
        console.log(error);
      }

      //MQTT CONNECTION SUCCESS
      this.client.on('connect', () => {
        console.log(this.client)

        console.log('Connection succeeded!');

      //SDATA SUBSCRIBE
      this.client.subscribe(deviceSubscribeTopic, {qos:0}, (err) => {
          if (err){
            console.log("Error in DeviceSubscription");
            return;
          }
          console.log("Device subscription Success");
          console.log(deviceSubscribeTopic); 
        });

      //NOTIF SUBSCRIBE
      this.client.subscribe(notifSubscribeTopic, {qos:0}, (err) => {
          if (err){
            console.log("Error in NotifSubscription");
            return;
          }
          console.log("Notif subscription Success");
          console.log(notifSubscribeTopic);
        });

      });


      this.client.on('error', error => {
          console.log('Connection failed', error)
      })

      this.client.on("reconnect", (error) => {
          console.log("reconnecting:", error);
          this.getMqttCredentialsForReconnection();
      });
      this.client.on('message', (topic, message) => {
          console.log("Message from topic "+ topic + "->")
          console.log(message.toString()); 

          try {
          const splittedTopic = topic.split("/");
          const msgType = splittedTopic[3];
          if(msgType == "notif"){
            this.$notify({ type: 'danger', icon: 'tim-icons icon-alert-circle-exc', message: message.toString()});
            this.$store.dispatch("getNotifications");
            return;

          }else if (msgType == "sdata"){
            $nuxt.$emit(topic, JSON.parse(message.toString()));
            return;
          }

        } catch (error) {
          console.log(error);
        }
      });
    
      $nuxt.$on('mqtt-sender', (toSend) => {
        this.client.publish(toSend.topic, JSON.stringify(toSend.msg));
      });
    },
    

    toggleSidebar() {
      if (this.$sidebar.showSidebar) {
        this.$sidebar.hideSidebar(false)
      }

    },
    initScrollbar() {
      let docClasses = document.body.classList;
      let isWindows = navigator.platform.startsWith("Win");
      if (isWindows) {
        // if we are on windows OS we activate the perfectScrollbar function
        initScrollbar("sidebar");
        initScrollbar("main-panel");
        initScrollbar("sidebar-wrapper");

        docClasses.add("perfect-scrollbar-on");
      } else {
        docClasses.add("perfect-scrollbar-off");
      }
    }
  }
}



</script>

<style lang="scss">
 

 // NOTAS: 

  // 1. El componente <sidebar-share> es el que se encarga de cambiar el color del sidebar, es decir, el color de fondo del sidebar. (LINEA 58 NO FUNCIONA)
// 2. CLASE 89. 
    // SIDEBAR --- VER ULTIMOS MINUTOS: 
    //No cambia de paginas al dar click, no muestra la pagina seleccionada, ni los 3 iconos de la derecha superior y No hace el zoom al cambiar de paginas 
    // Cuando minimizo el navegador no muestra el icono para ver el menu. 

