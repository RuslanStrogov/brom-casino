import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return this.appService.healthCheck();
  }

  @Get()
  @ApiOperation({ summary: 'API info' })
  getInfo() {
    return this.appService.getInfo();
  }
}
