const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const app = express();
app.use(cors());
app.use(express.json());

let tempraryImageDirectory;
if (process.env.DEV && process.env.DEV === 'Yes') {
  tempraryImageDirectory = path.join(__dirname, `../../tmp/`);
} else {
  tempraryImageDirectory = '/tmp/';
}

app.get('/weather', async (req, res) =>{
    try{
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{"role": "user", "content": "WHat is a fibonacci funciton"}],
        })
        console.log(response.choices[0].message.content);
        res.json({ text: response.choices[0].message.content});
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to process PDF');
  }

});

app.post('/ask', async (req, res) => {
  try {
    const { text, question } = req.body;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an assistant knowledgeable about PDFs.' },
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
