// imports to be added HR
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const OpenAI = require("openai");
const cors = require('cors');
const bodyParser = require('body-parser');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const app = express();
app.use(cors());
app.use(express.json());

let destino = '';
// Verify if is a dev site or production to add proper path for temp upload
   if (process.env.DEV && process.env.DEV === 'Yes') {
        destino = path.join(__dirname, `../../tmp/`);
      } else {
        destino = '/tmp/';
      }
    // This is the uplode site in a VPS, but as is versel I need temp path folder HR.
    const upload = multer({ dest: destino });
let pdfContent = '';

// Ruta para subir y procesar un archivo PDF
app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({ error: 'Por favor, sube un archivo PDF.' });
      }
  
      // Leer y procesar el archivo PDF
      const data = await pdfParse(file.path);
      pdfContent = data.text;
      
  
      return res.status(200).json({ message: 'PDF procesado correctamente.', content: pdfContent });
    } catch (error) {
      console.error('Error al procesar el PDF:', error);
      return res.status(500).json({ error: 'Error al procesar el PDF.' });
    }
  });

//   Generar el summary
app.post('/summary', async (req, res) => {
 
    if (!pdfContent) {
      return res.status(400).json({ error: 'No se detecta el PDF en el sistema.' });
    }
   
    try {
        // Realiza la consulta a OpenAI
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Eres un asistente legal responde preguntas basadas en contenido proporcionado.' },
            { role: 'user', content: `Contenido proporcionado:\n\n${pdfContent}\n\nPreguntas: quienes son los interesados en el contrato,\nFechas importantes en el contrato\npenalidades identificadas\ncostos ` },
          ],
        });
        // response.choices[0].message;
        const answer = response
        console.log(answer)
        return res.status(200).json({ answer });
      } catch (error) {
        console.error('Error al consultar OpenAI:', error);
        return res.status(500).json({ error: 'Error al consultar OpenAI.' });
      }
      
   
  });

  app.post('/ask', async (req, res) => {
    const { question } = req.body;
    try {
        // Realiza la consulta a OpenAI
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Eres un asistente legal responde preguntas basadas en contenido proporcionado.' },
            { role: 'user', content: `El contenido proporcionado este:\n\n${pdfContent}\n\nPreguntas: ${question}` },
          ],
        });
        // response.choices[0].message;
        const answer = response
        console.log(answer)
        return res.status(200).json({ answer });
      } catch (error) {
        console.error('Error al consultar OpenAI:', error);
        return res.status(500).json({ error: 'Error al consultar OpenAI.' });
      }
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));