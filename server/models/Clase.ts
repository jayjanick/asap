import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClase extends Document {
  planificacionId: Types.ObjectId;
  fecha: Date;
  tema: string;
  contenido: string;
  actividadSugerida?: string;
  horaInicio?: string;
  horaFin?: string;
  ejecutada?: boolean;
}

const ClaseSchema: Schema = new Schema(
  {
    planificacionId: { type: Schema.Types.ObjectId, ref: 'Planificacion', required: true },
    fecha: { type: Date, required: true },
    tema: { type: String, required: true },
    contenido: { type: String, required: true },
    actividadSugerida: { type: String },
    horaInicio: { type: String },
    horaFin: { type: String },
    ejecutada: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Clase || mongoose.model<IClase>('Clase', ClaseSchema);
