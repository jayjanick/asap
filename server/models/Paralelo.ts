import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IParalelo extends Document {
  nombre: string;
  grado: number;
  jornada: 'Matutina' | 'Vespertina' | 'Nocturna';
  docenteId: Types.ObjectId;
  materias: string[];
  nivel?: string;
  especialidad?: string;
}

const ParaleloSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    grado: { type: Number, required: true },
    jornada: { type: String, enum: ['Matutina', 'Vespertina', 'Nocturna'], default: 'Matutina' },
    docenteId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: 'Educación Básica Superior' },
    especialidad: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Paralelo || mongoose.model<IParalelo>('Paralelo', ParaleloSchema);
