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
import { Account } from './models/Account';
import { AccountController } from './controllers/AccountController';
import { AccountService } from './services/AccountService';
import { TopicController } from './controllers/TopicController';
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
import { Marketing } from './models/Marketing';
import { MarketingService } from './services/MarketingService';
import { MarketingController } from './controllers/MarketingController';
import { ReportService } from './services/ReportService';
import { ReportController } from './controllers/ReportController';
import { Comment } from './models/Comment';
import { CommentController } from './controllers/CommentController';
import { CommentService } from './services/CommentService';

dotenv.config();

const models = [
  Account,
  Token,
  OTP,
  Conversation,
  Topic,
  LineOfSpeech,
  Practice,
  Question,
  Prompt,
  Log,
  Marketing,
  Comment,
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
    AccountController,
    TopicController,
    ConversationController,
    PracticeController,
    PromptController,
    MarketingController,
    ReportController,
    CommentController,
  ],
  providers: [
    AppService,
    AccountService,
    TokenService,
    OTPService,
    ConversationService,
    PracticeService,
    PromptService,
    TopicService,
    ImageService,
    MarketingService,
    ReportService,
    CommentService,
  ],
})
export class AppModule {}
