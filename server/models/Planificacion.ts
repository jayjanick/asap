import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPlanificacion extends Document {
  docenteId: Types.ObjectId;
  materia: string;
  bloque: number;
  nombreBloque?: string;
  destreza: string;
  objetivos: string[];
  generadaIA: boolean;
  semanas?: number;
  recursos?: string[];
  progreso?: number; // 0 - 100
  estado?: 'Por iniciar' | 'En curso' | 'Completado';
}

const PlanificacionSchema: Schema = new Schema(
  {
    docenteId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    materia: { type: String, required: true },
    bloque: { type: Number, required: true },
    nombreBloque: { type: String },
    destreza: { type: String, required: true },
    objetivos: [{ type: String }],
    generadaIA: { type: Boolean, default: false },
    semanas: { type: Number, default: 4 },
    recursos: [{ type: String }],
    progreso: { type: Number, default: 0 },
    estado: { type: String, enum: ['Por iniciar', 'En curso', 'Completado'], default: 'En curso' },
  },
  { timestamps: true }
);

export default mongoose.models.Planificacion || mongoose.model<IPlanificacion>('Planificacion', PlanificacionSchema);
