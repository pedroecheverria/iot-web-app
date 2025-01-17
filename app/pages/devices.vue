<template>
    
    <div>
        <!-- Form for adding devices -->
        <div class="row">
            <card>

                <div slot="header">
                    <h4 class="card-title">Add New Area or Device</h4>
                </div>

                <div class="row">

                    <div class="col-4">
                        <base-input 
                            label="Device Name" 
                            type="text" 
                            placeholder="Ex: Home, Office..."
                            v-model="newDevice.name">
                        </base-input>
                    </div>

                    <div class="col-4">
                        <base-input 
                        label="Device Id" 
                        type="text" 
                        placeholder="Ex: 7891-93452"
                        v-model="newDevice.dId"
                        >
                    </base-input>
                    
                    </div>

                    <div class="col-4">
                        <slot name="label">
                            <label>Template</label>
                        </slot>
                        <el-select 
                            v-model="selectedIndexTemplate" 
                            placeholder="Select Template" 
                            class="select-primary" 
                            style="width:100%;" 
                            > 
                            <el-option 
                            v-for=" template, index in templates" :key="index"
                            class="text-dark" 
                            :value="index" 
                            :label="template.name" >
                        </el-option>




                        </el-select>
                    </div>

                </div>

                <div class="row pull-right">
                    <div class="col-12">
                        <base-button @click="createNewDevice()" type="primary" class="mb-3" size="lg">Add</base-button> 

                    </div>


                </div>


            </card>

        </div>

        <!-- Devices Tables: Tabla que contiene los dispositivos agregados o removidos-->
        <div class="row">
            <card>

                <div slot="header">
                    <h4 class="card-title">Areas or Devices</h4>
                </div>

                
                <el-table :header-cell-style="{ background: 'transparent' }" :data="$store.state.devices" >
                    
                    <!-- PARA AGREGAR UNA COLUMNA CON EL NUMERO DE DISPOSITIVO EN LA TABLA -->
                    <el-table-column label="Index" min-width="50" align="center">
                        <div slot-scope="{row, $index }">
                            {{ $index + 1 }}
                        </div>
                    </el-table-column>

                        <!-- NOMBRE DE LAS COLUMNAS DE LA TABLA -->
                        <!-- Prop: Se usa para que la tabla sepa que propiedad del objeto debe mostrar en la tabla. -->
                        
                    <el-table-column prop="name" label="Area or Device Name"  ></el-table-column>

                    <el-table-column prop ="dId" label="Device or Area Id"></el-table-column>

                    <el-table-column prop ="password" label="Key"></el-table-column>

                    <el-table-column prop ="templateName" label="Template"></el-table-column>

                    <!-- Aca deberia ir un boton que permita eliminar el dispositivo de la tabla por ej. Con Actions -->
                    
                    <el-table-column label="Actions">     
                        <div slot-scope="{row, $index }">

                            <!-- Icono de la base de datos -->
                            <el-tooltip content="Saver Status Indicator" style="margin-right:10px">
                                <font-awesome-icon
                                  :icon="['fas', 'database']"
                                  :class="{'text-success': row.saverRule.status, 'text-dark': !row.saverRule.status}"
                                  style="font-size: 30px; height: 20px;" />
                            </el-tooltip>


                            <!-- Boton del Switch -->
                            <el-tooltip content="Database Server">
                                <base-switch 
                                :class="{'text-success': row.saverRule.status, 'text-dark': !row.saverRule.status}"
                                @click="updateSaveRuleStatus(row.saverRule)" 
                                :value="row.saverRule.status" 
                                    type="primary"
                                    on-text="On"
                                    off-text="Off"
                                     > 
                                </base-switch>
                            </el-tooltip>    

                            <!-- Boton DELETE -->
                            <el-tooltip content="Delete" effect="light" :open-delay="300" placement="top">
                                <base-button type="danger" icon size="sm" class="btn-link" @click="deleteDevice(row)">
                                    <i class="tim-icons icon-trash-simple"></i>
                                </base-button>

                            </el-tooltip>
                        </div>
                    </el-table-column>

                </el-table>

            </card>

        </div>
<!-- <json :value="$store.state.selectedDevice"></json> -->
<!-- <json :value="$store.state.devices"></json> -->
    </div>

</template>

<script>
import {Table, TableColumn } from "element-ui";
import { Select, Option } from "element-ui";
import BaseButton from "@/components/BaseButton.vue";
import Json from '@/components/json.vue';
import { fontawesome } from '@/plugins/fontawesome.js'

export default {
    middleware: "authenticated",
    components: {
        [Table.name]: Table,
        [TableColumn.name]: TableColumn,
        [Select.name]: Select,
        [Option.name]: Option,
        BaseButton,
        Json,
        fontawesome

    },

    // Aca para simular le puse un array de objetos, pero en realidad deberia ser un array de objetos que vienen de la base de datos. Consulta a la DB y devuelve un array de objetos.
    data(){
        return{
            templates: [],
            selectedIndexTemplate: null,
            newDevice: {
                name: "",
                dId: "",
                templateId: "",
                templateName: ""
            }

        };
    },

mounted(){
    this.$store.dispatch("getDevices");
    this.getTemplates();
},

methods: {
    //new device
    createNewDevice() {
      if (this.newDevice.name == "") {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Device Name is Empty :("
        });
        return;
      }

      if (this.newDevice.dId == "") {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Device ID is Empty :("
        });
        return;
      }

      if (this.selectedIndexTemplate == null) {
        this.$notify({
          type: "warning",
          icon: "tim-icons icon-alert-circle-exc",
          message: " Tempalte must be selected"
        });
        return;
      }

      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        }
      };

      //ESCRIBIMOS EL NOMBRE Y EL ID DEL TEMPLATE SELECCIONADO EN EL OBJETO newDevice
      this.newDevice.templateId = this.templates[ this.selectedIndexTemplate]._id;
      this.newDevice.templateName = this.templates[this.selectedIndexTemplate].name;

      const toSend = {
        newDevice: this.newDevice
      };

      this.$axios
        .post("/device", toSend, axiosHeaders)
        .then(res => {

          if (res.data.status == "success") {

            this.$store.dispatch("getDevices");

            this.newDevice.name = "";
            this.newDevice.dId = "";
            this.selectedIndexTemplate = null;

            this.$notify({
              type: "success",
              icon: "tim-icons icon-check-2",
              message: "Success! Device was added"
            });

            return;
          }
        })
        .catch(e => {

          if (
            e.response.data.status == "error" &&
            e.response.data.error.errors.dId.kind == "unique"
          ) {
            this.$notify({
              type: "warning",
              icon: "tim-icons icon-alert-circle-exc",
              message:
                "The device is already registered in the system. Try another device"
            });
            return;
          } else {
            this.showNotify("danger", "Error");
            return;
          }
        });
    },
//Get Templates
    async getTemplates() {

    const axiosHeaders = {
    headers: {
        token: this.$store.state.auth.token
    }
    };

    try {
    const res = await this.$axios.get("/template", axiosHeaders);
    console.log(res.data);

    if (res.data.status == "success") {
        this.templates = res.data.data;
    }
    } catch (error) {
    this.$notify({
        type: "danger",
        icon: "tim-icons icon-alert-circle-exc",
        message: "Error getting templates..."
    });
    console.log(error);
    return;
    }
},

    deleteDevice(device){
        const axiosHeader = {
        headers: {
          token: this.$store.state.auth.token
        },
        params: {
          dId: device.dId
        }
      };

      this.$axios
        .delete("/device", axiosHeader)
        .then(res => {

          if (res.data.status == "success") {
            this.$notify({
              type: "success",
              icon: "tim-icons icon-check-2",
              message: device.name + " deleted!"
            });
            this.$store.dispatch("getDevices");
          }
          
        })
        .catch(e => {
          console.log(e);
          this.$notify({
            type: "danger",
            icon: "tim-icons icon-alert-circle-exc",
            message: " Error deleting " + device.name
          });
        });

    },

    updateSaveRuleStatus(rule){

    var ruleCopy = JSON.parse(JSON.stringify(rule));

      ruleCopy.status = !ruleCopy.status;

      const toSend = { 
        rule: ruleCopy 
      };
      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        }
      };
      this.$axios
        .put("/saver-rule", toSend, axiosHeaders)
        .then(res => {

          if (res.data.status == "success") {

            this.$store.dispatch("getDevices");

            this.$notify({
              type: "success",
              icon: "tim-icons icon-check-2",
              message: " Device Saver Status Updated"
            });

          }

          return;
        })
        .catch(e => {
          console.log(e);
          this.$notify({
            type: "danger",
            icon: "tim-icons icon-alert-circle-exc",
            message: " Error updating saver rule status"
          });
          return;
        });
    },
      
    }, 

}
</script>


<style scoped>
.icon-small {
  font-size: 0.1rem; /* Ajusta este valor según necesites */
}

table.el-table th.el-table__cell{
    background-color: transparent !important;
}
</style>