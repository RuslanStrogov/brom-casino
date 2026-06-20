import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'brom-casino-api',
      version: '0.1.0',
    };
  }

  getInfo() {
    return {
      name: 'Brom Casino API',
      version: '0.1.0',
      docs: '/api/docs',
      health: '/health',
    };
  }
}
