import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { blue, gray, green, magenta, red, yellow } from 'colorette';
import { Log, LogType } from './models/Log';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  private static logRepo: Repository<Log>;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Log)
    private readonly _logRepo: Repository<Log>,
  ) {
    AppService.logRepo = _logRepo;
  }

  getHello(): string {
    return 'Welcome to Code-versation API!';
  }

  private static log(
    level: LogType,
    colorFn: (msg: string) => string,
    message: string,
    data?: object,
    store?: boolean,
  ) {
    const timestamp = gray(`[${new Date().toISOString()}]`);
    console.log(`${timestamp} ${colorFn(`[${level}]`)} ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    if (store) {
      this.saveLog(message, level, data);
    }
  }

  static info(message: string, data?: object, store?: boolean) {
    this.log(LogType.INFO, blue, message, data);
  }

  static warn(message: string, data?: object, store?: boolean) {
    this.log(LogType.WARN, yellow, message, data);
  }

  static error(message: string, data?: object, store?: boolean) {
    this.log(LogType.ERROR, red, message, data);
  }

  static debug(message: string, data?: object, store?: boolean) {
    this.log(LogType.DEBUG, magenta, message, data);
  }

  static success(message: string, data?: object, store?: boolean) {
    this.log(LogType.SUCCESS, green, message, data);
  }

  /**
   * to save log into database
   * @param message
   * @param type
   * @param data
   * @returns
   */
  private static async saveLog(
    message: string,
    type: LogType,
    data?: object,
  ): Promise<void> {
    // CREATE NEW LOG
    const _log = new Log();
    _log.createdAt = new Date();
    _log.message = message;
    _log.data = data ? JSON.stringify(data, null, 2) : '{}';
    _log.type = type;

    // SAVE TO DATABASE
    try {
      await this.logRepo.save(_log);
    } catch (error) {
      AppService.error('Cannot save log', error);
    }
  }

  /**
   * to read all logs
   * @returns
   */
  async readAllLogs(): Promise<Log[]> {
    try {
      const logs = await this._logRepo.find();

      return logs.sort(
        (l1, l2) => l2.createdAt.getTime() - l1.createdAt.getTime(),
      );
    } catch (error) {
      AppService.error('Cannot read all logs', error);
      return [];
    }
  }
}
