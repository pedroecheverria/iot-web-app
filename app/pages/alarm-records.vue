<template>
    <div class="row">
      <!-- Card para el título y botones de descarga -->
      <card>
        <div class="row">
          <div class="col-md-6">
            <!-- Título de la sección -->
            <h1 class="title" style="
              text-align: center;
              font-size: 24px;
              font-family: 'Arial', sans-serif;
              color: #d47cd0;
              margin-top: 20px;
              margin-bottom: 20px;
              border-bottom: 2px solid #d47cd0;
              display: inline-block;
              padding-bottom: 5px;
            ">Triggered Alarm History</h1>
          </div>
          <div class="col-md-6" style="text-align: right;">
            <!-- Botones de descarga en formato Excel y PDF -->
            <a href="#" @click="downloadExcel" class="download-button excel">
            <i class="tim-icons icon-cloud-download-93"></i> Descargar Excel
          </a>
          <a href="#" @click="downloadPDF" class="download-button pdf">
            <i class="tim-icons icon-cloud-download-93"></i> Descargar PDF
          </a>

          </div>
        </div>
      </card>

    <card>
      <!-- Tabla -->
      <el-table :data="notifications" :header-cell-style="{ background: 'transparent' }">
        <el-table-column label="Area or Device Name" prop="deviceName"></el-table-column>
        <el-table-column label="Threshold" prop="value"></el-table-column>
        <el-table-column label="Condition" prop="condition"></el-table-column>
        <el-table-column label="Variable's Name" prop="variableFullName"></el-table-column>
        <el-table-column label="Value" prop="payload.value"></el-table-column>
        <el-table-column label="Date">
          <template slot-scope="scope">
            {{ formatDate(scope.row.time) }}
          </template>
        </el-table-column>
      </el-table>
    </card>
  </div>
</template>


<script>
import { Table, TableColumn } from "element-ui";
import { saveAs } from 'file-saver'; // Importa la función saveAs de la biblioteca file-saver


export default {
  middleware: "authenticated",
  components: {
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
    
  },
  data() {
    return {
      notifications: [],
    };
  },
  methods: {

    async downloadExcel() {
      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        },
        responseType: 'blob' // Indica que esperas una respuesta tipo Blob
      };

      try {
        // Realiza la solicitud al servidor para obtener los datos del Excel
        const response = await this.$axios.get('/downloadExcel_alarm-records', axiosHeaders);
        
        // Usa la biblioteca file-saver para guardar el archivo Excel
        const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
        saveAs(blob, 'Triggered_Alarms.xlsx'); // Nombre del archivo Excel
      } catch (error) {
        console.error('Error descargando el archivo Excel:', error);
        // Manejar el error aquí, como mostrar un mensaje al usuario
      }
    },

    async downloadPDF(){
      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        },
        responseType: 'blob' // Indica que esperas una respuesta tipo Blob para un archivo PDF
      };

      try {
        // Realiza la solicitud al servidor para obtener los datos del PDF
        const response = await this.$axios.get('/downloadPDF_alarm-records', axiosHeaders);
        
        // Usa la biblioteca file-saver para guardar el archivo PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        saveAs(blob, 'AlarmRecords.pdf'); // Nombre del archivo PDF
      } catch (error) {
        console.error('Error descargando el archivo PDF:', error);
        // Manejar el error aquí, como mostrar un mensaje al usuario
      }
    },

    async fetchData() {
      const axiosHeaders = {
  headers: {
    token: this.$store.state.auth.token
          }     
  }; 

      try {
        const res = await this.$axios.get("/alarm-notifications", axiosHeaders); 
        if (res.data.status == "success") {
          this.notifications = res.data.data;
        }
        
      } catch (error) {
        console.error(error);
        
      }
    },
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString(); // Cambia el formato según tus preferencias
    },
  },
  mounted() {
    this.fetchData();
    this.$store.dispatch("getNotifications");
  },
};
</script>


</script>

<style scoped>
.title {
  text-align: center;
  font-size: 24px;
  font-family: 'Arial', sans-serif;
  color: #d47cd0;
  margin-top: 20px;
  margin-bottom: 20px;
  border-bottom: 2px solid #d47cd0;
  display: inline-block;
  padding-bottom: 5px;
}

.download-button {
  display: inline-block;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.download-button i {
  margin-right: 5px;
}

.excel {
  background-color: #28a745;
}

.excel:hover {
  background-color: #218838;
}

.pdf {
  background-color: #dc3545;
}

.pdf:hover {
  background-color: #c82333;
}
</style>