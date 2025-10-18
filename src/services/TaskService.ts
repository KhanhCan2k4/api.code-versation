import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { MarketingStatus, Status } from 'src/datas/enums/status';
import { Account } from 'src/models/Account';
import { Conversation } from 'src/models/Conversation';
import { LineOfSpeech } from 'src/models/LineOfSpeech';
import { Log } from 'src/models/Log';
import { Marketing } from 'src/models/Marketing';
import { OTP } from 'src/models/OTP';
import { Question } from 'src/models/Question';
import { Token } from 'src/models/Token';
import { Topic } from 'src/models/Topic';
import {
  LessThan,
  MoreThanOrEqual,
  Not,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { TopicService } from './TopicService';
import { PromptService } from './PromptService';
import { MarketingController } from 'src/controllers/MarketingController';
import { AccountService } from './AccountService';
import { MarketingService } from './MarketingService';

@Injectable()
export class TasksService {
  constructor(
    // REPOS
    @InjectRepository(Account)
    protected readonly accountRepo: Repository<Account>,
    @InjectRepository(Conversation)
    protected readonly conRepo: Repository<Conversation>,
    @InjectRepository(LineOfSpeech)
    protected readonly lineRepo: Repository<LineOfSpeech>,
    @InjectRepository(Question)
    protected readonly questionRepo: Repository<Question>,
    @InjectRepository(Log)
    protected readonly logRepo: Repository<Log>,
    @InjectRepository(Marketing)
    protected readonly marRepo: Repository<Marketing>,
    @InjectRepository(OTP)
    protected readonly otpRepo: Repository<OTP>,
    @InjectRepository(Token)
    protected readonly tokenRepo: Repository<Token>,
    @InjectRepository(Topic)
    protected readonly topicRepo: Repository<Topic>,
    // SERVICES
    private readonly topicService: TopicService,
    private readonly promptService: PromptService,
    private readonly accountService: AccountService,
    private readonly marketingController: MarketingController,
    private readonly marketingService: MarketingService,
  ) {}

  // Run every 5 minutes
  @Interval(5 * 60 * 1000)
  async handleInterval() {
    AppService.info('Running task every 5 minutes...');
    // Calculate the date 5 minutes ago
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    // REMOVE OVER 5 MINUTES OTP
    try {
      const deletedItems = await this.otpRepo.find({
        where: {
          createdAt: LessThan(fiveMinutesAgo),
        },
      });

      await this.otpRepo.remove(deletedItems);
      AppService.success(
        `Remove deleted otps successfully`,
        { total: deletedItems.length },
        true,
      );
    } catch (error) {
      AppService.error(`Cannot remove deleted otps`, error, true);
    }
  }

  //   @Timeout(1000)
  async createConversation() {
    const topic = await this.topicService.getRandomTopic();

    if (!topic) {
      AppService.error('Cannot create conversation, topic null');
    } else {
      const conversation = await this.promptService.createConversation(topic);

      if (conversation) {
        AppService.success(
          'Created a new conversation',
          { ...conversation, lines: conversation.lines.length },
          true,
        );

        // CREATE NEW QUESTIONS
        const questions =
          await this.promptService.createQuestions(conversation);

        if (questions.length === 0) {
          AppService.error('Cannot create new questions', [], true);
        } else {
          AppService.success(
            'Create new questions',
            { questions: questions.length },
            true,
          );
        }
      } else {
        AppService.error('Cannot create a new conversation', undefined, true);
      }
    }
  }

  // Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTask() {
    AppService.info('Running daily task...');

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // REMOVE 30 DAYS DELETED ACCOUNTS
    await TasksService.removedDeleteItems(
      this.accountRepo,
      thirtyDaysAgo,
      'accounts',
    );

    // REMOVE 30 DAYS DELETED LINES, QUESTIONS, CONVERSATIONS
    await TasksService.removedDeleteItems(
      this.lineRepo,
      thirtyDaysAgo,
      'lines',
    );
    await TasksService.removedDeleteItems(
      this.questionRepo,
      thirtyDaysAgo,
      'questions',
    );
    await TasksService.removedDeleteItems(
      this.conRepo,
      thirtyDaysAgo,
      'conversations',
    );

    // REMOVE 30 DAYS DELETED MARKETINGS
    await TasksService.removedDeleteItems(
      this.marRepo,
      thirtyDaysAgo,
      'marketings',
    );

    // REMOVE 30 DAYS DELETED TOPICS
    await TasksService.removedDeleteItems(
      this.topicRepo,
      thirtyDaysAgo,
      'topics',
    );

    // REMOVE OVER 30 DAYS LOGS
    try {
      const deletedItems = await this.logRepo.find({
        where: {
          createdAt: LessThan(thirtyDaysAgo),
        },
      });

      await this.logRepo.remove(deletedItems);
      AppService.success(`Remove deleted logs successfully`, undefined, true);
    } catch (error) {
      AppService.error(`Cannot remove deleted logs`, error, true);
    }

    // PROCESS THE DAILY MARKETINGS
    try {
      const mars = await this.marRepo.find({
        where: {
          activatedAt: MoreThanOrEqual(new Date()),
          status: Not(Status.DELETED),
        },
      });

      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      for (const marketing of mars) {
        const createdDateOnly = new Date(
          marketing.activatedAt.getFullYear(),
          marketing.activatedAt.getMonth(),
          marketing.activatedAt.getDate(),
        );
        const diffDays = Math.floor(
          (todayDateOnly.getTime() - createdDateOnly.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Post if it's exactly on a loop day
        if (diffDays % marketing.loop === 0) {
          // POST ON FACEBOOK
          if (marketing.status === MarketingStatus.FOR_FACEBOOK) {
            MarketingController.createFacebookPost(
              marketing,
              (link: string) => {
                AppService.success(
                  'Created a new post on facebook',
                  { link },
                  true,
                );
              },
            );
          } else if (marketing.status === MarketingStatus.FOR_GMAIL) {
            // GET ALL ACTIVE ACCOUNTS
            const accounts = await this.accountService.getAllBasicAccounts();

            // SEND EMAIL
            let count = 0;
            for (const account of accounts) {
              if (
                await this.marketingController.createGmailPost(
                  marketing,
                  account,
                )
              ) {
                count += 1;
              }
            }
          }

          // UPDATE TIMES TO SPEAD
          marketing.count += 1;
          await this.marketingService.store(marketing);
        }
      }
    } catch (error) {
      AppService.error('Cannot process the frequently marketings', error);
    }

    // CREATE NEW CONVERSATION, QUESTIONS
    await this.createConversation();
  }

  // Runs every Monday at 8 AM
  @Cron('0 8 * * 1')
  async handleWeeklyTask() {
    AppService.info('Running weekly task...');
    // Calculate the date 7 days ago
    const senvenDaysAgo = new Date();
    senvenDaysAgo.setDate(senvenDaysAgo.getDate() - 7);
    // REMOVE 7 DAYS DELETED TOKENS
    await TasksService.removedDeleteItems(
      this.tokenRepo,
      senvenDaysAgo,
      'tokens',
    );
  }

  /** STATIC METHODS */
  /**
   * to remove items with status DELETED in a specific repo
   * @param repo
   * @param targetDate
   * @param scope
   */
  static async removedDeleteItems(
    repo: Repository<ObjectLiteral>,
    targetDate: Date,
    scope: string,
  ): Promise<void> {
    try {
      const deletedItems = await repo.find({
        where: {
          status: Status.DELETED,
          updatedAt: LessThan(targetDate),
        },
      });

      await repo.remove(deletedItems);
      AppService.success(
        `Remove deleted ${scope} successfully`,
        undefined,
        true,
      );
    } catch (error) {
      AppService.error(`Cannot remove deleted ${scope}`, error, true);
    }
  }
}
