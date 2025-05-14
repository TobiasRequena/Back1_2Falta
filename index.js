//index.js

import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { extraerTexto } from './horario.js';

dotenv.config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

app.post('/subir-horario', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo PDF.' });
    }

    const buffer = req.file.buffer;
    const resultado = await extraerTexto(buffer);
    res.json(resultado);
  } catch (error) {
    console.error('Error procesando archivo:', error);
    res.status(500).json({ error: 'Error al procesar el archivo PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
