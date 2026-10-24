import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActividad extends Document {
  paraleloId: Types.ObjectId;
  claseId?: Types.ObjectId;
  titulo: string;
  descripcion?: string;
  tipo: 'Individual' | 'Grupal' | 'Evaluacion' | 'Proyecto';
  fechaEntrega: Date;
  ponderacion: number; // Por ejemplo escala 10 puntos
  instrucciones?: string;
  criteriosEvaluacion?: string[];
  generadaIA?: boolean;
}

const ActividadSchema: Schema = new Schema(
  {
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo', required: true },
    claseId: { type: Schema.Types.ObjectId, ref: 'Clase', required: false },
    titulo: { type: String, required: true },
    descripcion: { type: String },
    tipo: {
      type: String,
      enum: ['Individual', 'Grupal', 'Evaluacion', 'Proyecto'],
      default: 'Individual',
    },
    fechaEntrega: { type: Date, required: true },
    ponderacion: { type: Number, default: 10 },
    instrucciones: { type: String },
    criteriosEvaluacion: [{ type: String }],
    generadaIA: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Actividad || mongoose.model<IActividad>('Actividad', ActividadSchema);
