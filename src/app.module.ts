import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CharacterModule } from './modules/CharacterModule';
import { AccountModule } from './modules/AccountModule';
import { AIAssistantModule } from './modules/AIAssistantModule';
import { AIModelModule } from './modules/AiModelModule';
import { ConversationModule } from './modules/ConversationModule';
import { LanguageModule } from './modules/LanguageModule';
import { LearningSentenceModule } from './modules/LearningSentenceModule';
import { PromptModule } from './modules/PromptModule';
import { ReportModule } from './modules/ReportModule';
import { ReportReasonModule } from './modules/ReportReasonModule';
import { RewardModule } from './modules/RewardModule';
import { SentenceModule } from './modules/SentenceModule';
import { SituationModule } from './modules/SituationModule';
import { StreakModule } from './modules/StreakModule';
import { TeamModule } from './modules/TeamModule';
import { TokenModule } from './modules/TokenModule';
import { VoiceModule } from './modules/VoiceModule';
import * as dotenv from 'dotenv';

dotenv.config();

const options: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: +(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'code-versations',
  entities: [__dirname + '/src/models'],
  synchronize: true, // Disable in production
};

@Module({
  imports: [
    TypeOrmModule.forRoot(options),
    AccountModule,
    AIAssistantModule,
    AIModelModule,
    CharacterModule,
    ConversationModule,
    LanguageModule,
    LearningSentenceModule,
    PromptModule,
    ReportModule,
    ReportReasonModule,
    RewardModule,
    SentenceModule,
    SituationModule,
    StreakModule,
    TeamModule,
    TokenModule,
    VoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
