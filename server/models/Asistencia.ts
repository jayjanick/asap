import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistroAsistencia {
  alumnoId: Types.ObjectId;
  estado: 'P' | 'A' | 'F'; // Presente, Atraso, Falta
  justificada: boolean;
  motivo?: string;
  horaRegistro?: string;
}

export interface IAsistencia extends Document {
  paraleloId: Types.ObjectId;
  fecha: Date;
  materia: string;
  registros: IRegistroAsistencia[];
  observacionGeneral?: string;
}

const RegistroAsistenciaSchema = new Schema(
  {
    alumnoId: { type: Schema.Types.ObjectId, ref: 'Alumno', required: true },
    estado: { type: String, enum: ['P', 'A', 'F'], default: 'P' },
    justificada: { type: Boolean, default: false },
    motivo: { type: String, default: '' },
    horaRegistro: { type: String },
  },
  { _id: false }
);

const AsistenciaSchema: Schema = new Schema(
  {
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo', required: true },
    fecha: { type: Date, required: true },
    materia: { type: String, required: true },
    registros: [RegistroAsistenciaSchema],
    observacionGeneral: { type: String },
  },
  { timestamps: true }
);

// Índice compuesto para no duplicar asistencia del mismo día y materia por paralelo
AsistenciaSchema.index({ paraleloId: 1, fecha: 1, materia: 1 });

export default mongoose.models.Asistencia || mongoose.model<IAsistencia>('Asistencia', AsistenciaSchema);
