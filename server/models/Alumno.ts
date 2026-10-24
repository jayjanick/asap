import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAlumno extends Document {
  nombre: string;
  cedula: string;
  paraleloId: Types.ObjectId;
  activo: boolean;
  contactoRepresentante?: string;
  telefonoRepresentante?: string;
  observaciones?: string[];
}

const AlumnoSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    cedula: { type: String, required: false },
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo', required: true },
    activo: { type: Boolean, default: true },
    contactoRepresentante: { type: String },
    telefonoRepresentante: { type: String },
    observaciones: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Alumno || mongoose.model<IAlumno>('Alumno', AlumnoSchema);
