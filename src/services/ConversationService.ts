import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/models/Account';
import { Conversation } from 'src/models/Conversation';
import PaginatedObject from 'src/models/PaginatedObject';
import { Repository } from 'typeorm';
import { AccountService } from './AccountService';
import { AppService } from 'src/app.service';
import { LineOfSpeech } from 'src/models/LineOfSpeech';
import { Topic } from 'src/models/Topic';

@Injectable()
export class ConversationService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Conversation)
    protected readonly conRepo: Repository<Conversation>,
    @InjectRepository(LineOfSpeech)
    protected readonly lineRepo: Repository<LineOfSpeech>,
    protected readonly accountService: AccountService,
  ) {}

  /** METHODS **/
  /**
   * to get paginated conversations
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Account>>
   */
  async getPaginatedConversations(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    excludedIds: number[] = [-1],
    key?: string,
  ): Promise<PaginatedObject<Conversation>> {
    try {
      const totalData = await this.conRepo.count();

      if (perPage < 1) {
        perPage = this.PER_PAGE;
      }

      const lastPage = Math.ceil((totalData * 1.0) / perPage);

      if (page < 1 || page > lastPage) {
        page = lastPage;
      }
    } catch (e) {
      page = 1;
      perPage = this.PER_PAGE;
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    try {
      const [cons, total] = await this.conRepo
        .createQueryBuilder('conversations')
        .where(`conversations.id NOT IN (${excludedIds.join(',')})`)
        .skip(skip)
        .take(take)
        .orderBy('updated_at', 'DESC')
        .addOrderBy('title', 'ASC')
        .getManyAndCount();

      return new PaginatedObject(page, perPage, key, total, cons);
    } catch (e) {
      throw new Error('Cannot paginate', e);
    }
  }

  /**
   * get a random welcome conversation
   * @returns
   */
  async getWelcomeConversation(): Promise<Conversation | null> {
    // GET WELCOME CONVERSATION IDS
    const welcomeConIds = [1];
    const id = welcomeConIds[Math.floor(Math.random() * welcomeConIds.length)];

    AppService.debug('Welcome conversation id', { id });

    // QUERY AND RETURN DATA
    const conversation = await this.conRepo.findOne({
      where: { id: id },
      relations: ['lines', 'lines.speaker'],
    });

    if (conversation) {
      conversation['image'] =
        `/topics/${conversation.topic?.id ?? conversation.topic_id}.jpg`;
    }

    return conversation;
  }

  /**
   * to save conversation into database
   * @param conversation
   * @returns boolean
   */
  async saveConversation(conversation: Conversation): Promise<boolean> {
    // AppService.debug('conversation', conversation);
    const line_of_speechs = [...conversation.lines];

    try {
      const savedCon = await this.conRepo.save({ ...conversation, lines: [] });
      // AppService.debug('savedCon', savedCon);

      try {
        // SAVE LINES OF SPEECHS
        // AppService.debug('lines', line_of_speechs);

        line_of_speechs.forEach((line) => {
          line.conversation = new Conversation();
          line.conversation.id = savedCon.id;
          line.conversation_id = savedCon.id;
          line.speaker = new Account();
          line.speaker.id = line.speaker_id;
        });

        // AppService.debug('lines', line_of_speechs);

        await this.lineRepo.save(line_of_speechs);
      } catch (error) {
        AppService.error(
          "Cannot save conversation's lines into database",
          error,
        );
        await this.conRepo.delete(savedCon);
        return false;
      }

      return true;
    } catch (error) {
      AppService.error('Cannot save conversation into database', error);
      return false;
    }
  }

  /**
   * to get a line in a conversation by it's id
   * @param id
   * @returns
   */
  async getLineOfSpeechById(id: number): Promise<LineOfSpeech | null> {
    return this.lineRepo.findOne({
      where: { id: id },
      relations: ['conversation'],
    });
  }

  /**
   * to save line of speech into database
   * @param line
   * @returns
   */
  async saveLineOfSpeech(line: LineOfSpeech): Promise<boolean> {
    try {
      await this.lineRepo.save(line);

      return true;
    } catch (error) {
      AppService.error('Cannot save line into database', error);
      return false;
    }
  }
}
