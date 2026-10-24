import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('usuario:password')) {
    console.log('[asap DB] MONGODB_URI no configurado o es plantilla de ejemplo. Operando con fallback persistente en memoria.');
    isConnected = false;
    return false;
  }

  try {
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log('[asap DB] Conectado exitosamente a MongoDB Atlas.');
    return true;
  } catch (error) {
    console.warn('[asap DB] No se pudo conectar a MongoDB Atlas:', (error as Error).message);
    console.log('[asap DB] Activando fallback transparente en memoria para todas las operaciones.');
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export default { connectDB, isMongoConnected };
