import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      service: 'webshop-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      healthy: true,
      timestamp: new Date().toISOString(),
    };
  }
}
