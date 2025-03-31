import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { MailService } from 'src/services/MailService';
import * as dotenv from 'dotenv';

dotenv.config();

const mailerOptions: MailerOptions = {
  transport: {
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  defaults: {
    from: '"No Reply" <noreply@example.com>',
  },
  template: {
    dir: join(__dirname, '..', 'public/views/mails'),
    adapter:
      new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
    options: {
      strict: true,
    },
  },
};
 
@Module({
  imports: [MailerModule.forRoot(mailerOptions)],
  providers: [MailService],
})
export class MailModule {}
 