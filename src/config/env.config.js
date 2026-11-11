import dotenv from 'dotenv';

dotenv.config();

const requiredVariables = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

for (const variable of requiredVariables) {
  if (!process.env[variable]?.trim()) {
    throw new Error(`Falta configurar la variable de entorno obligatoria: ${variable}`);
  }
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('La variable PORT debe ser un número entero entre 1 y 65535');
}

const mongoUri = process.env.MONGODB_URI.trim();

if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
  throw new Error('MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://');
}

const nodeEnv = process.env.NODE_ENV.trim();

if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV debe ser development, test o production');
}

export const config = Object.freeze({
  port,
  mongoUri,
  nodeEnv
});
