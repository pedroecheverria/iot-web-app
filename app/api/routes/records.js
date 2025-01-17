const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/authentication.js');
const ExcelJS = require('exceljs');
import Notification from '../models/notifications.js';
import Data from '../models/data.js';
import Template from '../models/template.js';
import PDFDocument from 'pdfkit';


// Endpoint para obtener las notificaciones
router.get('/alarm-notifications', checkAuth, async (req, res) => {
    try {
        // filtrar las notificaciones por el userId del usuario autenticado
        const userId = req.userData._id;
        console.log("ESTE ES EL USERID:", userId);
  
        // Realiza la consulta a MongoDB para obtener las notificaciones
        const notifications = await Notification.find({ userId: userId }).sort({ time: -1 });
  
        const response = {
            status: "success",
            data: notifications
        };
  
        res.json(response);
    } catch (error) {
        console.error(error);
        const response = {
            status: "error",
            message: "Error retrieving notifications",
            error: error.message
        };
        res.status(500).json(response);
    }
  });


// Endpoint para obtener los records de los datos de campo. 
router.get('/data-records', checkAuth, async (req, res) => {
    try {
        // filtrar las notificaciones por el userId del usuario autenticado
        const userId = req.userData._id;
        console.log("ESTE ES EL USERID:", userId);
  
        // Realiza la consulta a MongoDB para obtener las notificaciones
        const datas = await Data.find({ userId: userId }).sort({ time: -1 });
  
        const response = {
            status: "success",
            data: datas
        };
  
        res.json(response);
    } catch (error) {
        console.error(error);
        const response = {
            status: "error",
            message: "Error retrieving datas",
            error: error.message
        };
        res.status(500).json(response);
    }
  });


// Endopoint para descargar los registros de los datos de campo en formato Excel.
router.get('/downloadExcel_data-records', checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;
  
    // Obtener todos los templates asociados con el userId
    const templates = await Template.find({ userId: userId });
  
    // Crear un mapa de variable a variableFullName
    let variableToFullNameMap = {};
    templates.forEach(template => {
      template.widgets.forEach(widget => {
        variableToFullNameMap[widget.variable] = widget.variableFullName;
      });
    });

    // Buscar datos en MongoDB
    const records = await Data.find({ userId: userId });
  
    // Crear un nuevo libro de trabajo de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Data');
  
    // Definir las cabeceras de la hoja de trabajo
    worksheet.columns = [
      { header: 'Device ID', key: 'dId' },
      { header: "Variable's Name", key: 'variableFullName' },
      { header: 'Variable ID', key: 'variable' },
      { header: 'Value', key: 'value' },
      { header: 'Date', key: 'date', width: 20 },
    ];
  
    // Añadir los datos al libro de trabajo
    records.forEach(record => {
      const variableFullName = variableToFullNameMap[record.variable] || 'N/A';

      const dateObject = new Date(record.time);
      const formattedDateTime = dateObject.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
  
      worksheet.addRow({
        dId: record.dId,
        variableFullName: variableFullName,
        variable: record.variable,
        value: record.value,
        date: formattedDateTime
      });
    });
  
    // Ajustar las columnas a su contenido
    worksheet.columns.forEach(column => {
      column.width = column.width || 15;
    });
  
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="data-${userId}.xlsx"`);
  
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al generar el archivo Excel');
  }
});

// Descargar los datos de campo en formato PDF
router.get('/downloadPDF_data-records', checkAuth, async (req, res) => {
    try {
      const userId = req.userData._id;
      
      // Obtener los templates para el mapeo
      const templates = await Template.find({ userId: userId });
      let variableToFullNameMap = {};
      templates.forEach(template => {
        template.widgets.forEach(widget => {
          variableToFullNameMap[widget.variable] = widget.variableFullName;
        });
      });
  
      // Buscar datos en MongoDB
      const dataRecords = await Data.find({ userId: userId });
  
      // Inicializar el documento PDF
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Records.pdf"`);
  
      doc.pipe(res);

    //   doc.font('path/to/custom/font.ttf');
  
    // Agregar un diseño o imagen de fondo

      const  imagePath = 'assets/images/Sentil.png';
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
    doc.image(imagePath, 0, 0, { width: pageWidth, height: pageHeight });

    doc.moveDown(5);

    // Establecer el título en negrita y más grande
    doc.font('Helvetica-Bold') // Asegúrate de que la fuente en negrita esté disponible o usa una fuente personalizada en negrita
    .fontSize(30) // Ajusta el tamaño de la fuente según sea necesario
    .text('Data Records', { align: 'center' });

    // Subtítulo con la misma fuente personalizada
    doc.fontSize(18)
    .moveDown(0.5)
    .text('Sentil App', { align: 'center' });

    // Ahora, mover hacia abajo para empezar a dibujar la tabla
        doc.moveDown(1);   
  
      // Encabezados de la tabla
      doc.fontSize(12).fillColor('black');
      const headers = ['Device ID', 'Variable ID', 'Variable\'s Name', 'Value', 'Date'];
      const columnWidths = [70, 80, 180, 40, 180];
      let currentY = doc.y;
  
      headers.forEach((header, i) => {
        doc.rect(doc.x, currentY, columnWidths[i], 20).fillAndStroke('#000000', '#000000');
        doc.fillColor('#FFFFFF').text(header, doc.x + 2, currentY + 6);
        doc.x += columnWidths[i];
      });
  
      doc.x = doc.page.margins.left; // Reset X coordinate
      currentY += 20;
  
      // Filas de la tabla
      dataRecords.forEach(record => {
        const formattedDate = new Date(record.time).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const variableFullName = variableToFullNameMap[record.variable] || 'N/A';
        
        const data = [
          record.dId,
          record.variable,
          variableFullName,
          record.value,
          formattedDate
        ];
  
        data.forEach((text, i) => {
          doc.rect(doc.x, currentY, columnWidths[i], 20).stroke();
          doc.fillColor('black').text(text, doc.x + 2, currentY + 6);
          doc.x += columnWidths[i];
        });
  
        doc.x = doc.page.margins.left; // Reset X coordinate
        currentY += 20;
      });
  
      doc.end();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al generar el archivo PDF');
    }
  });

// Endopoint para descargar los registros de las alarmas en formato Excel.
router.get('/downloadExcel_alarm-records', checkAuth, async (req, res) => {
    try {
      // Obtener el userId del usuario autenticado
      const userId = req.userData._id; 
  
      // Buscar notificaciones en MongoDB
      const notifications = await Notification.find({ userId: userId });
  
      // Crear un nuevo libro de trabajo de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Notifications');
  
      // Definir las cabeceras de la hoja de trabajo
      worksheet.columns = [
        { header: 'Area or Device Name', key: 'deviceName', width: 30 },
        { header: 'Threshold', key: 'value', width: 15 },
        { header: 'Condition', key: 'condition', width: 15 },
        { header: "Variable's Name", key: 'variableFullName', width: 30 },
        { header: 'Value', key: 'payloadValue', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
      ];
  
      // Añadir los datos al libro de trabajo
      notifications.forEach(notification => {
        const dateObject = new Date(notification.time);
        const formattedDate = dateObject.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
  
        worksheet.addRow({
          deviceName: notification.deviceName,
          value: notification.value,
          condition: notification.condition,
          variableFullName: notification.variableFullName,
          payloadValue: notification.payload.value,
          date: formattedDate
        });
      });
  
      // Establecer el tipo de contenido y la disposición de la respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Notifications.xlsx"');
  
      // Escribir el archivo Excel en la respuesta y enviarlo
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error al generar el archivo Excel');
    }


});


// Descargar los registros de las alarmas en formato PDF
router.get('/downloadPDF_alarm-records', checkAuth, async (req, res) => {
  try {
    const userId = req.userData._id;

    // Obtener los datos de alarma de MongoDB
    const alarmRecords = await Notification.find({ userId: userId });

    // Inicializar el documento PDF
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Alarm_Records.pdf"');

    // Pipe the PDF into an alarm-records.pdf file
    doc.pipe(res);

     // Agregar un diseño o imagen de fondo
     const  imagePath = 'assets/images/Sentil.png';
     const pageWidth = doc.page.width;
     const pageHeight = doc.page.height;
    doc.image(imagePath, 0, 0, { width: pageWidth, height: pageHeight });




    doc.moveDown(5);

    // Título
    doc.font('Helvetica-Bold').fontSize(30).text('Alarm Records', { align: 'center' });

    // Subtítulo
    // doc.moveDown(0.5).font('Helvetica').fontSize(18).text('Generated by Sentil App', { align: 'center' });
        // Subtítulo con la misma fuente personalizada
        doc.fontSize(18)
        .moveDown(0.5)
        .text('Sentil App', { align: 'center' });

    doc.moveDown(1);

    // Encabezados de la tabla
    doc.fontSize(12).fillColor('black');
    const headers = ['Area or Device Name', 'Umbral', 'Condition', 'Variable\'s Name', 'Value', 'Date'];
    const columnWidths = [125, 55, 60, 130, 50, 180];
    let currentY = doc.y;

    doc.fontSize(12);
    headers.forEach((header, i) => {
      doc.rect(doc.x, currentY, columnWidths[i], 20).fillAndStroke('#000000', '#FFFFFF');
      doc.fillColor('#FFFFFF').text(header, doc.x + 2, currentY + 6);
      doc.x += columnWidths[i];
    });

    doc.x = doc.page.margins.left; // Reset X coordinate
    currentY += 20;

    function formatVariableName(variableName) {
      const replacements = {
        'Conductividad - despues de la OI': 'Conductividad (D-OI)',
        'Conductividad - despues del EDI': 'Conductividad (D-EDI)',
        'Conductividad - del loop': 'Conductividad (Loop)',
        // Agrega más reemplazos aquí según sea necesario
      };
    
      return replacements[variableName] || variableName; // Devuelve el nombre reformateado o el original si no se necesita reemplazo
    }

    // Filas de la tabla
    alarmRecords.forEach(record => {
      const formattedDate = new Date(record.time).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
  
        // Aplica la función para formatear el nombre de la variable
      const variableName = formatVariableName(record.variableFullName);
      
      const data = [
        record.deviceName, // Asumiendo que 'areaOrDeviceName' es la propiedad del nombre del área o dispositivo
        record.value,        // Asumiendo que 'threshold' es la propiedad del umbral
        record.condition,        // Asumiendo que 'condition' es la propiedad de la condición
        variableName,     // Asumiendo que 'variableName' es la propiedad del nombre de la variable
        record.payload.value, // Asumiendo que 'value' es la propiedad del valor
        formattedDate            // La fecha formateada
      ];

      data.forEach((text, i) => {
        doc.rect(doc.x, currentY, columnWidths[i], 20).stroke();
        doc.fillColor('black').text(text, doc.x + 2, currentY + 6);
        doc.x += columnWidths[i];
      });

      doc.x = doc.page.margins.left; // Reset X coordinate
      currentY += 20;
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al generar el archivo PDF');
  }
});
//     alarmRecords.forEach(record => {
//       const formattedDate = record.time.toLocaleString('es-ES');
//       const data = [
//         record.deviceName, // Asumiendo que 'areaOrDeviceName' es la propiedad del nombre del área o dispositivo
//         record.threshold,        // Asumiendo que 'threshold' es la propiedad del umbral
//         record.condition,        // Asumiendo que 'condition' es la propiedad de la condición
//         record.variableName,     // Asumiendo que 'variableName' es la propiedad del nombre de la variable
//         record.value,            // Asumiendo que 'value' es la propiedad del valor
//         formattedDate            // La fecha formateada
//       ];

//       data.forEach((text, i) => {
//         doc.rect(doc.x, currentY, columnWidths[i], 20).stroke();
//         doc.fillColor('black').text(text, doc.x + 10, currentY + 6);
//         doc.x += columnWidths[i];
//       });

//       doc.x = doc.page.margins.left; // Reset X coordinate
//       currentY += 20;
//     });

//     // Finalizar el documento PDF
//     doc.end();
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error al generar el archivo PDF');
//   }
// });

module.exports = router;
