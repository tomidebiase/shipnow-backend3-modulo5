import { config } from '../config/index.js';
import { mocksRepository } from '../repositories/mocks.repository.js';
import { createMocksService } from './mocks.service.js';

export const mocksService = createMocksService(mocksRepository, {
  allowSeed: config.nodeEnv !== 'production'
});

