import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumento extends Document {
  id: string;
  nombre: string;
  categoria: 'Personal' | 'Planificación' | 'Estudiante' | 'Plantilla' | 'Institucional';
  descripcion?: string;
  tamano: string;
  fechaSubida: string;
  tipo: string;
  contenidoBase64?: string;
  url?: string;
  docenteId?: string;
  createdAt: Date;
}

const DocumentoSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    categoria: {
      type: String,
      enum: ['Personal', 'Planificación', 'Estudiante', 'Plantilla', 'Institucional'],
      default: 'Personal'
    },
    descripcion: { type: String, default: '' },
    tamano: { type: String, default: '150 KB' },
    fechaSubida: { type: String, default: () => new Date().toLocaleDateString('es-EC') },
    tipo: { type: String, default: 'PDF' },
    contenidoBase64: { type: String },
    url: { type: String },
    docenteId: { type: String, default: 'docente-1' }
  },
  { timestamps: true }
);

export default mongoose.models.Documento || mongoose.model<IDocumento>('Documento', DocumentoSchema);
