//horario.js

import 'dotenv/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfparse = require('pdf-parse');
const fs = require('fs');

// Esquemas Zod
const MateriaSchema = z.object({
  nombre: z.string(),
  categoria: z.string(),
}).nullable(); // ← importante

const ProfesorSchema = z.object({
  nombre: z.string(),
}).nullable(); // ← también puede ser null

const ModuloSchema = z.object({
  nroModulo: z.number(),
  horaInicio: z.string(),
  horaFin: z.string(),
  recreo: z.boolean(), // ← puede ser null
  materia: MateriaSchema, // ← puede ser null
  profesor: ProfesorSchema, // ← también puede ser null
}).nullable(); // ← puede ser null

const TurnoSchema = z.object({
  nombre: z.string(),
  horaInicio: z.string(),
  horaFin: z.string(),
  modulos: z.array(ModuloSchema),
});

const DiaSchema = z.object({
  nombre: z.string(),
  turnos: z.array(TurnoSchema),
});

const RootSchema = z.object({
  dias: z.array(DiaSchema),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const extraerTexto = async (pdfBuffer) => {
    // const buffer = fs.readFileSync('./horarios-sexto.pdf');
    const data = await pdfparse(pdfBuffer);
    const textoPlano = data.text;

    const response = await openai.responses.parse({
      model: "gpt-4o", // Usamos modelo compatible con `responses.parse`
      input: [
        {
          role: "system",
          content: `
            Sos un asistente que convierte horarios escolares desde texto plano al siguiente formato estructurado.

            Tené en cuenta:
            - Las materias técnicas son las relacionadas con electrónica, telecomunicaciones, FAT, integrador, emprendimientos.
            - Las materias como inglés, higiene y seguridad pueden clasificarse como "Aúlica".
            - Cada bloque horario es un módulo (ej: de 13:10 a 13:50).
            - Un día tiene un solo turno ("Tarde") que va de 13:10 a 19:40.
            - Si un módulo está vacío o dice "sin clases", debe tener la materia y el profesor en null.
            - Revisa la existencia de recreos. Pero no deben opacar el resto del horario, es decir, que si dice sin clases, se debe poner null. Y si hay una materia se debe poner la materia y el profesor.`
        },
        {
          role: "user",
          content: textoPlano,
        },
      ],
      text: {
        format: zodTextFormat(RootSchema, "horario"),
      },
    });

    const resultado = response.output_parsed;
    return resultado
};

// extraerTexto();
