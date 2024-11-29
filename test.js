require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
    // const destino = path.join(process.cwd(), 'tmp');
    let destino = '';
    // Verify if is a dev site or production to add proper path for temp upload
    if (process.env.DEV && process.env.DEV === 'Yes') {
        destino = path.join(__dirname, `../../tmp/`);
      } else {
        destino = '/tmp/';
      }
    // This is the uplode site in a VPS, but as is versel I need temp path folder
      // const upload = multer({ dest: 'uploads/' });
    const upload = multer({ dest: destino });
let pdfContent = '';

// simple function to test the api in versel
app.get('/wea', async (req, res) =>{
    try{
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a lawyer assistant" },
                {
                    role: "user",
                    content: "Can you tell me the menaning of Quid pro quo in lawyer language?.",
                },
            ],
        });
        console.log(completion.choices);
        res.json({ text: completion.choices[0].message });
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to process opeai');
  }

});

// function to upload and read PDF
  app.post('/pdf', upload.single('pdf'), async (req, res) => {
    console.log('funning');
    try {
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({ error: 'Por favor, sube un archivo PDF.' });
      }
  
      // Leer y procesar el archivo PDF
    //   i parce the PDF as is easier than create a Vector for Openai,m openai upload as vector is in beta version
      const data = await pdfParse(file.path);
      pdfContent = data.text;
    } catch (error) {
        console.error('Error al procesar el PDF:', error);
        return res.status(500).json({ error: 'Error al procesar el PDF.' });
      }
    //   return res.status(200).json({ message: 'PDF procesado correctamente.', content: pdfContent });
    try {
        // Realiza la consulta a OpenAI
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Eres un asistente legal responde preguntas basadas en contenido proporcionado.' },
            { role: 'user', content: `El contenido proporcionado este:\n\n${pdfContent}\n\nPreguntas: quienes son los interesados en el contrato,\nFechas importantes en el contrato\npenalidades identificadas\ncostos ` },
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
    try {
      const { text, question } = req.body;
  
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'Eres un asistente legal responde preguntas basadas en un PDF cargado.' },
          { role: 'user', content: `Here's the content of a PDF: "${text}". Now, answer this question: "${question}".` },
        ],
      });
  
      res.json({ answer: response.data.choices[0].message.content });
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to process question');
    }
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));