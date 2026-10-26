import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Importar solo lo necesario inline para Vercel
const { app } = await import('../server/routes/api.js');
export default app;
