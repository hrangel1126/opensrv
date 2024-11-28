const OpenAI = require("openai");
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const openai = new OpenAI();
console.log('first ');
const app = express();
app.use(cors());
app.use(express.json());
