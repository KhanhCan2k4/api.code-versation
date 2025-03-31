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
    data?: object,
  ) {
    const timestamp = gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${colorFn(`[${level}]`)} ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  static info(message: string, data?: object) {
    this.log('INFO', blue, message, data);
  }

  static warn(message: string, data?: object) {
    this.log('WARN', yellow, message, data);
  }

  static error(message: string, data?: object) {
    this.log('ERROR', red, message, data);
  }

  static debug(message: string, data?: object) {
    this.log('DEBUG', magenta, message, data);
  }

  static success(message: string, data?: object) {
    this.log('SUCCESS', green, message, data);
  }
}
