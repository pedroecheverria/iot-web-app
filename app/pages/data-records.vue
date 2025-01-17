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
            ">Data History</h1>
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
    <el-table :data="datas" :header-cell-style="{ background: 'transparent' }">
      <el-table-column label="Device ID" prop="dId"></el-table-column>
 
      <el-table-column label="Variable's Name">
        <template slot-scope="scope">
          {{ getVariableFullName(scope.row.variable) }}
        </template>
      </el-table-column>

      <el-table-column label="variable ID" prop="variable"></el-table-column>
      <el-table-column label="Value" prop="value"></el-table-column>
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
    import Card from '../components/Cards/Card.vue';
    import { saveAs } from 'file-saver'; // Importa la función saveAs de la biblioteca file-saver   

export default {
  middleware: "authenticated",

  components: {
    Card,
    [Table.name]: Table,
    [TableColumn.name]: TableColumn,
  },
  data() {
    return {
      datas: [],
    };
  },
  methods: 
  {

    getVariableFullName(variable) {
      for (const device of this.$store.state.devices) {
        const foundWidget = device.template.widgets.find(widget => widget.variable === variable);
        if (foundWidget) {
          return foundWidget.variableFullName;
        }
      }
      return 'N/A'; // Valor predeterminado si no se encuentra
    },

    async downloadExcel() {
    // Configuración de los encabezados para la solicitud HTTP
    const axiosHeaders = {
      headers: {
        token: this.$store.state.auth.token
      },
      responseType: 'blob' // Es necesario para decirle a Axios que recibirá un archivo binario
    };

    try {
      // Realizar la solicitud de descarga
      const response = await this.$axios.get('/downloadExcel_data-records', axiosHeaders);

      // Crear un URL para el blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // Crear un enlace para descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DataRecords.xlsx'); // El nombre del archivo que se descargará
      document.body.appendChild(link);
      link.click();

      // Limpiar y liberar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar el archivo Excel:', error);
      // Aquí deberías manejar el error, tal vez mostrar un mensaje al usuario
    }
    },

    async downloadPDF() {
      const axiosHeaders = {
        headers: {
          token: this.$store.state.auth.token
        },
        responseType: 'blob' // Indica que esperas una respuesta tipo Blob para un archivo PDF
      };

      try {
        // Realiza la solicitud al servidor para obtener los datos del PDF
        const response = await this.$axios.get('/downloadPDF_data-records', axiosHeaders);
        
        // Usa la biblioteca file-saver para guardar el archivo PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        saveAs(blob, 'DataRecords.pdf'); // Nombre del archivo PDF
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
        const res = await this.$axios.get("/data-records", axiosHeaders); 
        if (res.data.status == "success") {
          this.datas = res.data.data;
        }
        
      } catch (error) {
        console.log(error);
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },
  },

  mounted() {
    this.fetchData();

  },
};



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