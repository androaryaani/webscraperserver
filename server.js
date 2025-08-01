// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $('h1, h2, h3').each((i, el) => {
      results.push($(el).text().trim());
    });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/export', (req, res) => {
  const { data, format } = req.body;

  const fileName = `output_${Date.now()}`;
  const filePath = path.join(__dirname, 'data');
  if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);

  let fileContent = '';
  let extension = format.toLowerCase();

  if (format === 'JSON') {
    fileContent = JSON.stringify(data, null, 2);
  } else if (format === 'CSV') {
    fileContent = data.map(item => `"${item}"`).join('\n');
  } else if (format === 'TXT') {
    fileContent = data.join('\n');
  }

  const fullPath = `${filePath}/${fileName}.${extension}`;
  fs.writeFileSync(fullPath, fileContent);

  res.json({ success: true, file: `http://localhost:3000/data/${fileName}.${extension}` });
});

app.use('/data', express.static(path.join(__dirname, 'data')));

app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
