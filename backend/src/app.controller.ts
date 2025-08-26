import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  async testDatabase() {
    try {
      const result = await this.dataSource.query('SELECT 1 as test');
      const options = this.dataSource.options as any;
      return {
        status: 'success',
        message: 'Database connection successful',
        result,
        database: options.database,
        host: options.host,
        port: options.port,
      };
    } catch (error) {
      const options = this.dataSource.options as any;
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        database: options.database,
        host: options.host,
        port: options.port,
      };
    }
  }
}
