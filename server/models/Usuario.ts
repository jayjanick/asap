import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
  nombre: string;
  email: string;
  password?: string;
  rol: 'Docente' | 'Director' | 'Coordinador';
  materias: string[];
  institucion: string;
  telefono?: string;
  avatar?: string;
  createdAt: Date;
}

const UsuarioSchema: Schema = new Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['Docente', 'Director', 'Coordinador'], default: 'Docente' },
    materias: [{ type: String }],
    institucion: { type: String, required: true },
    telefono: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Usuario || mongoose.model<IUsuario>('Usuario', UsuarioSchema);
