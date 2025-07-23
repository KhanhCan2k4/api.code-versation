import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { Language } from './models/Language';
import { LanguageController } from './controllers/LanguageController';
import { LanguageService } from './services/LanguageService';
import { TeamRole } from './models/TeamRole';
import { TeamRoleController } from './controllers/TeamRoleController';
import { TeamRoleService } from './services/TeamRoleService';
import { Account } from './models/Account';
import { Voice } from './models/Voice';
import { AccountController } from './controllers/AccountController';
import { AccountService } from './services/AccountService';
import { VoiceController } from './controllers/VoiceController';
import { VoiceService } from './services/VoiceService';
import { Situation } from './models/Situation';
import { TopicController } from './controllers/TopicController';
import { SituationService } from './services/SituationService';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { Token } from './models/Token';
import { TokenService } from './services/TokenService';
import { OTP } from './models/OTP';
import { OTPService } from './services/OTPService';
import { Conversation } from './models/Conversation';
import { Topic } from './models/Topic';
import { ConversationService } from './services/ConversationService';
import { ConversationController } from './controllers/ConversationController';
import { LineOfSpeech } from './models/LineOfSpeech';
import { Practice } from './models/Practice';
import { Question } from './models/Question';
import { PracticeController } from './controllers/PracticeController';
import { PracticeService } from './services/PracticeService';
import { Prompt } from './models/Prompt';
import { PromptController } from './controllers/PromptController';
import { PromptService } from './services/PromptService';
import { TopicService } from './services/TopicService';
import { ImageService } from './services/ImageService';
import { Log } from './models/Log';

dotenv.config();

const models = [
  Language,
  TeamRole,
  Account,
  Voice,
  Situation,
  Token,
  OTP,
  Conversation,
  Topic,
  LineOfSpeech,
  Practice,
  Question,
  Prompt,
  Log,
];

const typeOrmModuleOptions: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: +(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'code-versations',
  entities: models,
  synchronize: true, // Disable in production
};

const serveStaticModuleOptions: ServeStaticModuleOptions = {
  rootPath: join(__dirname, '..', 'public/images'), // Serve "datas" folder
  serveRoot: '/images', // URL path prefix
};

const mailerOptions: MailerOptions = {
  transport: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: +(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER || '22211tt2577@mail.tdc.edu.vn',
      pass: process.env.SMTP_PASS || '',
    },
  },
  template: {
    dir: join(__dirname, '..', 'public', 'views', 'mails'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
};

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmModuleOptions),
    TypeOrmModule.forFeature(models),
    ServeStaticModule.forRoot(serveStaticModuleOptions),
    MailerModule.forRoot(mailerOptions),
  ],
  controllers: [
    AppController,
    LanguageController,
    TeamRoleController,
    AccountController,
    VoiceController,
    TopicController,
    ConversationController,
    PracticeController,
    PromptController,
  ],
  providers: [
    AppService,
    LanguageService,
    TeamRoleService,
    AccountService,
    VoiceService,
    SituationService,
    TokenService,
    OTPService,
    ConversationService,
    PracticeService,
    PromptService,
    TopicService,
    ImageService,
  ],
})
export class AppModule {}
