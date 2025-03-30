import { Injectable } from '@nestjs/common';
import { blue, gray, green, magenta, red, yellow } from 'colorette';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Code-versation API!';
  }

  private static log(
    level: string,
    colorFn: (msg: string) => string,
    message: string,
  ) {
    const timestamp = gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${colorFn(`[${level}]`)} ${message}`);
  }

  static info(message: string) {
    this.log('INFO', blue, message);
  }

  static warn(message: string) {
    this.log('WARN', yellow, message);
  }

  static error(message: string) {
    this.log('ERROR', red, message);
  }

  static debug(message: string) {
    this.log('DEBUG', magenta, message);
  }

  static success(message: string) {
    this.log('SUCCESS', green, message);
  }
}
