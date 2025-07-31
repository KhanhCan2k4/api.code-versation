import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { Account } from 'src/models/Account';
import { Conversation } from 'src/models/Conversation';
import { Marketing } from 'src/models/Marketing';
import { Prompt } from 'src/models/Prompt';
import { Topic } from 'src/models/Topic';
import { Repository } from 'typeorm';

type ReportPart = { name: string; value: number };

@Injectable()
export class ReportService {
  /** PROPERTIES **/
  private MAX_PROMPT_COUNTING = 5;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Account)
    protected readonly accountRepo: Repository<Account>,
    @InjectRepository(Topic)
    protected readonly topicRepo: Repository<Topic>,
    @InjectRepository(Prompt)
    protected readonly promptRepo: Repository<Prompt>,
    @InjectRepository(Conversation)
    protected readonly conRepo: Repository<Conversation>,
   
    @InjectRepository(Marketing)
    protected readonly marRepo: Repository<Marketing>,
  ) {}

  /** METHODS **/
  /**
   * to get the user growth report in latest 12 months
   * @returns
   */
  async getUserGrowthReport(): Promise<ReportPart[]> {
    // GET ALL USERS
    try {
      const createdTimes: Date[] = (
        await this.accountRepo
          .createQueryBuilder('account')
          .select('account.created_at', 'created_at')
          .getRawMany()
      ).map((row) => new Date(row.created_at));

      // AppService.debug('createdTimes', createdTimes);

      // ARRANGE INTO LATEST 12 MOTHS
      const growthReport = ReportService.countDatesByMonth(createdTimes);

      return growthReport;
    } catch (error) {
      AppService.error('Cannot get user growth', error, true);
      return [];
    }
  }

  /**
   * to get the topic growth report in latest 12 months
   * @returns
   */
  async getTopicGrowthReport(): Promise<ReportPart[]> {
    // GET ALL TOPICS
    try {
      const createdTimes: Date[] = (
        await this.topicRepo
          .createQueryBuilder('topics')
          .select('topics.updated_at', 'updated_at')
          .getRawMany()
      ).map((row) => new Date(row.updated_at));

      // AppService.debug('createdTimes', createdTimes);

      // ARRANGE INTO LATEST 12 MOTHS
      const growthReport = ReportService.countDatesByMonth(createdTimes);

      return growthReport;
    } catch (error) {
      AppService.error('Cannot get topic growth', error, true);
      return [];
    }
  }

  /**
   * to get the prompt counting report
   * @returns
   */
  async getPromptCountingReport(max: number): Promise<ReportPart[]> {
    // GET ALL PROMPS
    try {
      const editCounts: ReportPart[] = (
        await this.promptRepo
          .createQueryBuilder('prompts')
          .select('prompts.count', 'count')
          .addSelect('prompts.title', 'title')
          .orderBy('prompts.count', 'DESC')
          .getRawMany()
      )
        .map((row) => ({ name: row.title, value: row.count }))
        .splice(0, max ?? this.MAX_PROMPT_COUNTING);

      AppService.debug('editCounts', editCounts);

      return editCounts;
    } catch (error) {
      AppService.error('Cannot get prompt count', error, true);
      return [];
    }
  }

  /**
   * to get the marketing counting report
   * @returns
   */
  async getMarketingCountingReport(max: number): Promise<ReportPart[]> {
    // GET ALL PROMPS
    try {
      const editCounts: ReportPart[] = (
        await this.marRepo
          .createQueryBuilder('marketings')
          .select('marketings.count', 'count')
          .addSelect('marketings.title', 'title')
          .orderBy('marketings.count', 'DESC')
          .getRawMany()
      )
        .map((row) => ({ name: row.title, value: row.count }))
        .splice(0, max ?? this.MAX_PROMPT_COUNTING);

      AppService.debug('editCounts', editCounts);

      return editCounts;
    } catch (error) {
      AppService.error('Cannot get marketing count', error, true);
      return [];
    }
  }

  /**
   * to get the conversation comparation report
   * @returns
   */
  async getConversationComparationReport(): Promise<ReportPart[]> {
    // GET ALL CONVERSATIONS
    try {
      const cons: { topicId: number }[] = await this.conRepo
        .createQueryBuilder('conversations')
        .select('conversations.topic_id', 'topicId')
        .getRawMany();

      AppService.debug('cons', cons);

      // CREATE REPORT
      const report: ReportPart[] = [];

      // COUNT EACH TYPE
      const welcomeCount = cons.filter((c) => c.topicId === -1).length;
      report.push(
        {
          name: 'Welcome Conversations',
          value: welcomeCount,
        },
        {
          name: 'Others',
          value: cons.length - welcomeCount,
        },
      );

      return report;
    } catch (error) {
      AppService.error('Cannot get conversation comparation', error, true);
      return [];
    }
  }

  /** STATIC METHODS */
  /**
   * to get quantity in latest 12 months
   */
  static countDatesByMonth(dates: Date[]): ReportPart[] {
    const result: ReportPart[] = [];
    const now = new Date();

    // Get last 12 months as keys
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      result.push({ name: monthKey, value: 0 });
    }

    dates.forEach((date) => {
      const diffMonths =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());

      if (diffMonths >= 0 && diffMonths < 12) {
        const index = 11 - diffMonths;
        result[index].value += 1;
      }
    });

    return result;
  }
}
