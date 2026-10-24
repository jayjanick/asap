import { app } from '../server/routes/api';

// Vercel espera que el entry point exporte la app de Express para manejarla como Serverless Function
export default app;
