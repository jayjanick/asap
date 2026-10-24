import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICalificacion extends Document {
  entregaId?: Types.ObjectId;
  actividadId?: Types.ObjectId;
  alumnoId: Types.ObjectId;
  paraleloId: Types.ObjectId;
  nota: number; // 0.00 a 10.00
  tipo: string;
  periodo: string;
  observacion?: string;
}

const CalificacionSchema: Schema = new Schema(
  {
    entregaId: { type: Schema.Types.ObjectId, ref: 'Entrega', required: false },
    actividadId: { type: Schema.Types.ObjectId, ref: 'Actividad', required: false },
    alumnoId: { type: Schema.Types.ObjectId, ref: 'Alumno', required: true },
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo', required: true },
    nota: { type: Number, required: true, min: 0, max: 10 },
    tipo: { type: String, default: 'Deber' },
    periodo: { type: String, default: '1er Quimestre - Parcial 1' },
    observacion: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Calificacion || mongoose.model<ICalificacion>('Calificacion', CalificacionSchema);
