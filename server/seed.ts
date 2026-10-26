import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from './db';
import Usuario from './models/Usuario';
import Paralelo from './models/Paralelo';
import Alumno from './models/Alumno';
import Documento from './models/Documento';
import { PARALELOS_INICIALES, PLANTILLAS_MINEDUC } from '../client/src/data/mockData';

dotenv.config();

export async function seedDatabase(force = false) {
  const connected = await connectDB();
  if (!connected) {
    console.log('[Seed] MongoDB no está conectado. Saltando seed en base de datos física.');
    return;
  }

  try {
    const existingUser = await Usuario.findOne({ email: 'andres.morales@uefdemocracia.edu.ec' });
    if (existingUser && !force) {
      let isPassValid = false;
      try {
        if (existingUser.password && existingUser.password.startsWith('$2')) {
          isPassValid = await bcrypt.compare('asap2024', existingUser.password);
        }
      } catch (e) {}

      if (!isPassValid) {
        console.log('[Seed] Actualizando contraseña de Andrés Morales a hash bcrypt de asap2024...');
        existingUser.password = await bcrypt.hash('asap2024', 10);
        await existingUser.save();
      }
      console.log('[Seed] La base de datos ya contiene al docente Andrés Morales. No se requiere seed completo.');
      return;
    }

    console.log('[Seed] Iniciando población inicial de datos de prueba...');

    // 1. Docente Andrés Morales
    const hashedPassword = await bcrypt.hash('asap2024', 10);
    const docente = await Usuario.findOneAndUpdate(
      { email: 'andres.morales@uefdemocracia.edu.ec' },
      {
        nombre: 'Lic. Andrés Morales',
        email: 'andres.morales@uefdemocracia.edu.ec',
        password: hashedPassword,
        rol: 'Docente',
        materias: ['Lengua y Literatura'],
        institucion: 'U.E. Fisco-Misional Democracia',
        telefono: '+593 98 765 4321',
        avatar: 'https://picsum.photos/seed/docente_andres/150/150'
      },
      { upsert: true, new: true }
    );

    console.log(`[Seed] Usuario ${docente.nombre} registrado con éxito.`);

    // 2. Paralelos y Alumnos
    for (const p of PARALELOS_INICIALES) {
      const paraleloDoc = await Paralelo.findOneAndUpdate(
        { nombre: p.nombre },
        {
          nombre: p.nombre,
          grado: p.grado,
          nivel: p.nivel,
          jornada: p.jornada,
          materia: p.materia,
          horario: p.horario,
          aula: p.aula,
          docenteId: docente._id.toString()
        },
        { upsert: true, new: true }
      );

      // Crear o actualizar alumnos
      for (const est of p.estudiantes) {
        await Alumno.findOneAndUpdate(
          { cedula: est.cedula },
          {
            nombre: est.nombre,
            cedula: est.cedula,
            numeroLista: est.numeroLista,
            paraleloId: paraleloDoc._id.toString(),
            activo: est.activo,
            telefonoRepresentante: est.telefonoRepresentante || '+593 99 123 4567',
            faltasJustificadas: est.faltasJustificadas || 0,
            faltasInjustificadas: est.faltasInjustificadas || 0,
            atrasos: est.atrasos || 0
          },
          { upsert: true }
        );
      }
      console.log(`[Seed] Paralelo ${p.nombre} con ${p.estudiantes.length} alumnos procesado.`);
    }

    // 3. Documentos iniciales de prueba
    const docs = [
      {
        nombre: 'Plan_Curricular_Anual_Lengua_8vo.pdf',
        categoria: 'Planificación',
        descripcion: 'PCA oficial aprobado por vicerrectorado periodo 2026-2027',
        tamano: '380 KB',
        tipo: 'PDF',
        fechaSubida: '12/03/2026',
        docenteId: docente._id.toString()
      },
      {
        nombre: 'Acta_Junta_Curso_1er_Quimestre.pdf',
        categoria: 'Institucional',
        descripcion: 'Acta formal con resoluciones de rendimiento',
        tamano: '210 KB',
        tipo: 'PDF',
        fechaSubida: '28/03/2026',
        docenteId: docente._id.toString()
      },
      {
        nombre: 'PRAI_Estudiantes_En_Riesgo.docx',
        categoria: 'Estudiante',
        descripcion: 'Planes de refuerzo académico individualizados',
        tamano: '145 KB',
        tipo: 'DOCX',
        fechaSubida: '04/04/2026',
        docenteId: docente._id.toString()
      }
    ];

    for (const d of docs) {
      await Documento.findOneAndUpdate(
        { nombre: d.nombre },
        d,
        { upsert: true }
      );
    }
    console.log('[Seed] Documentos de prueba creados.');
    console.log('[Seed] ¡Base de datos poblada exitosamente!');
  } catch (err) {
    console.error('[Seed] Error al poblar base de datos:', err);
  }
}

// Si se ejecuta directamente vía CLI: `npm run seed`
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase(true).then(() => {
    console.log('[Seed] Proceso terminado.');
    process.exit(0);
  });
}
