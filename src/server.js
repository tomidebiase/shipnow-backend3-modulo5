import { logger } from './config/logger.js';

try {
  const [{ default: app }, { config }, { connectDatabase }] = await Promise.all([
    import('./app.js'),
    import('./config/index.js'),
    import('./config/database.js')
  ]);

  await connectDatabase();

  app.listen(config.port, () => {
    logger.info(`Servidor ShipNow escuchando en el puerto ${config.port}`);
  });
} catch (error) {
  logger.fatal('No se pudo iniciar ShipNow', { errorName: error.name });
  process.exitCode = 1;
}
