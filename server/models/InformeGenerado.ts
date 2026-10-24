import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInformeGenerado extends Document {
  docenteId: Types.ObjectId;
  paraleloId?: Types.ObjectId;
  tipo: string; // 'Rendimiento Parcial', 'Asistencia Mensual', 'Plan de Mejora', 'Informe Quimestral'
  titulo: string;
  contenido: string;
  fechaGenerado: Date;
  formato: 'PDF' | 'DOCX' | 'JSON';
  metadatos?: Record<string, any>;
}

const InformeGeneradoSchema: Schema = new Schema(
  {
    docenteId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo' },
    tipo: { type: String, required: true },
    titulo: { type: String, required: true },
    contenido: { type: String, required: true },
    fechaGenerado: { type: Date, default: Date.now },
    formato: { type: String, enum: ['PDF', 'DOCX', 'JSON'], default: 'PDF' },
    metadatos: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.InformeGenerado || mongoose.model<IInformeGenerado>('InformeGenerado', InformeGeneradoSchema);
