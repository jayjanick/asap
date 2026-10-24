import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEntrega extends Document {
  actividadId: Types.ObjectId;
  alumnoId: Types.ObjectId;
  fechaEntrega?: Date;
  contenido?: string;
  archivoUrl?: string;
  estado: 'Entregado' | 'Pendiente' | 'Tarde' | 'No Entregado';
  observacionDocente?: string;
}

const EntregaSchema: Schema = new Schema(
  {
    actividadId: { type: Schema.Types.ObjectId, ref: 'Actividad', required: true },
    alumnoId: { type: Schema.Types.ObjectId, ref: 'Alumno', required: true },
    fechaEntrega: { type: Date },
    contenido: { type: String },
    archivoUrl: { type: String },
    estado: {
      type: String,
      enum: ['Entregado', 'Pendiente', 'Tarde', 'No Entregado'],
      default: 'Pendiente',
    },
    observacionDocente: { type: String },
  },
  { timestamps: true }
);

EntregaSchema.index({ actividadId: 1, alumnoId: 1 }, { unique: true });

export default mongoose.models.Entrega || mongoose.model<IEntrega>('Entrega', EntregaSchema);
