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
    // const destino = path.join(process.cwd(), 'tmp');
    let destino = '';
    if (process.env.DEV && process.env.DEV === 'Yes') {
        destino = path.join(__dirname, `../../tmp/`);
      } else {
        destino = '/tmp/';
      }
    // const upload = multer({ dest: 'uploads/' });
    const upload = multer({ dest: destino });

    // const elpedf = multer({ storage });

let pdfContent = '';

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
    res.status(500).send('Failed to process PDF');
  }

});
  app.post('/pdf', upload.single('pdf'), async (req, res) => {
    try {
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({ error: 'Por favor, sube un archivo PDF.' });
      }
  
      // Leer y procesar el archivo PDF
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
            { role: 'system', content: 'Eres un asistente legal responde preguntas basadas en un PDF cargado.' },
            { role: 'user', content: `El contenido del PDF es este:\n\n${pdfContent}\n\nPreguntas: quienes son los interesados en el contrato,\nFechas importantes en el contrato\npenalidades identificadas\ncostos ` },
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