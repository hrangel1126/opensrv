const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');
import { OpenAI } from "openai";
const openai = new OpenAI();
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// const openai = new OpenAIApi({
//     apiKey: process.env.OPENAI_API_KEY
//     });
openai.apiKey({
    apiKey: process.env.OPENAI_API_KEY
});
const tools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            parameters: {
                type: "object",
                properties: {
                    location: { type: "string" },
                    unit: { type: "string", enum: ["c", "f"] },
                },
                required: ["location", "unit"],
                additionalProperties: false,
            },
        },
    }
];

app.post('/weather', async (req, res) =>{
    try{
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{"role": "user", "content": "What's the weather like in Paris today?"}],
            tools,
        })
        console.log(response.choices[0].message.tool_calls);
        res.json({ text: response.choices[0].message.tool_calls });
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to process PDF');
  }

});
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const pdfBuffer = req.file.stream
    const pdfData = await pdfParse(pdfBuffer);
    const vectorStore = await openai.beta.vectorStores.create({ name: req.file.filename,
        expires_after: { anchor: 'last_active_at', days: 1 } // Expires 1 days after last use

     });
     const files = req.file.stream;
    console.log('vectorStoreId', vectorStore.id);
    await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files });
    const assistant = await openai.beta.assistants.create({
        name: 'contract Master',
        model: 'gpt-4',
        tools: [{ type: 'file_search' }], // retrieval -> file_search
        tool_resources: { // Instead of file_id, add the Vector Store's ID
          file_search: {
            vector_store_ids: [vectorStore.id] // ID of the created Vector Store
          }
        }
      });
    res.json({ text: pdfData.text });
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
