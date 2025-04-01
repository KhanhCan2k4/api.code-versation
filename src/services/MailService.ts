import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import * as dotenv from 'dotenv';

@Injectable()
export class MailService {
  private static APP_NAME = '';
  private static SUPPORT_EMAIL = '';

  constructor(private readonly mailerService: MailerService) {
    dotenv.config();

    MailService.APP_NAME = process.env.APP_NAME ?? 'Code-versations';
    MailService.APP_NAME =
      process.env.SUPPORT_EMAIL ?? 'levietkhanh2k4@gmail.com';
  }

  /**
   * send mail to welcome user after successful registration
   *
   * @param toEmail
   * @param name
   * @returns Promise<boolean>
   */
  async sendWelcomingMessage(toEmail: string, name: string): Promise<boolean> {
    //prepare data
    const title = `Welcome to ${MailService.APP_NAME}`;
    const sendMailOptions: ISendMailOptions = {
      to: toEmail,
      subject: title,
      template: 'welcome',
      context: {
        title,
        name,
      },
    };

    //send email
    try {
      await this.mailerService.sendMail(sendMailOptions);
      AppService.success(`Email sent to ${toEmail}`);
      return true;
    } catch (error) {
      AppService.error(`Error sending email to ${toEmail}:`, error);
      return false;
    }
  }

  async sendLoginMessage(toEmail: string, name: string): Promise<boolean> {
    //prepare data
    const title = `Login to ${MailService.APP_NAME}`;
    const loginUrl = 'https://google.com';
    const sendMailOptions: ISendMailOptions = {
      to: toEmail,
      subject: title,
      template: 'login',
      context: {
        title,
        name,
        loginUrl,
      },
    };

    //send email
    try {
      await this.mailerService.sendMail(sendMailOptions);
      AppService.success(`Email sent to ${toEmail}`);
      return true;
    } catch (error) {
      AppService.error(`Error sending email to ${toEmail}:`, error);
      return false;
    }
  }
}
