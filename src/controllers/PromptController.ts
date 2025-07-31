import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { AccountService } from 'src/services/AccountService';
import { ConversationService } from 'src/services/ConversationService';
import { PracticeService } from 'src/services/PracticeService';
import { PromptService } from 'src/services/PromptService';
import { TopicService } from 'src/services/TopicService';

@Controller('/api/prompts')
export class PromptController {
  // CONSTRUCTOR
  constructor(
    private readonly promptService: PromptService,
    private readonly conService: ConversationService,
    private readonly practiceService: PracticeService,
    private readonly topicService: TopicService,
    private readonly accountService: AccountService,
  ) {}

  //   METHODS
  /**
   * to get all prompt in pagination
   * @param res
   * @param header
   * @returns
   */
  @Get('/')
  async getPaginated(@Res() res, @Headers() header: { token: string }) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      const prompts = await this.promptService.getAllPrompts();

      return res.status(200).json(prompts);
    } catch (error) {
      AppService.error('Cannot get prompts', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to create new ai assistant
   * @param res
   * @param header
   * @returns
   */
  @Get('/create-assistant')
  async createAIAssistant(@Res() res, @Headers() header: { token: string }) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      const assistant = await this.promptService.createAIAssistant();

      return res.status(200).json(assistant);
    } catch (error) {
      AppService.error('Cannot create assistant', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to create new topic
   * @param res
   * @param header
   * @returns
   */
  @Get('/create-topic')
  async createTopic(@Res() res, @Headers() header: { token: string }) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      const topic = await this.promptService.createTopic();

      return res.status(200).json(topic);
    } catch (error) {
      AppService.error('Cannot create topic', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to create new marketing
   * @param res
   * @param header
   * @returns
   */
  @Get('/create-marketing')
  async createMarketing(
    @Res() res,
    @Query() query: { title: string },
    @Headers() header: { token: string },
  ) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      const marketing = await this.promptService.createMarketing(query.title);

      return res.status(200).json(marketing);
    } catch (error) {
      AppService.error('Cannot create marketing', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to create new conversation
   * @param res
   * @param header
   * @returns
   */
  @Get('/create-conversation')
  async createConversation(
    @Res() res,
    @Query() query: { topic_id: number },
    @Headers() header: { token: string },
  ) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    let topic = await this.topicService.getTopicById(query.topic_id);

    if (!topic) {
      topic = await this.topicService.getRandomTopic();
    }

    if (!topic) {
      AppService.error('Cannot create conversation, topic null');
      return res.status(500).json(false);
    }

    try {
      const conversation = await this.promptService.createConversation(topic);
      return res.status(200).json(conversation);
    } catch (error) {
      AppService.error('Cannot create conversation', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to create new conversation
   * @param res
   * @param header
   * @returns
   */
  @Get('/create-welcome')
  async createWelcomeConversation(
    @Res() res,
    @Query() query: { account_id: number },
    @Headers() header: { token: string },
  ) {
    // GET ADMIN AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    const account = await this.accountService.getAIAccountByID(
      query.account_id,
    );

    if (!account) {
      AppService.error('AI Assistant Not Found');
      return res.status(500).json(false);
    }

    try {
      const conversation =
        await this.promptService.createWelcomeConversation(account); 
      return res.status(200).json(conversation);
    } catch (error) {
      AppService.error('Cannot create conversation', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to explain a sentence in a conversation
   * @param res
   * @param header
   * @returns
   */
  @Get('/explain-sentence')
  async explainSentence(@Res() res, @Query() query: { id: number }) {
    const line = await this.conService.getLineOfSpeechById(query.id);

    if (!line) {
      AppService.error('Line Not Found');
      return res.status(500).json(false);
    }

    if (line.shortExplanation) {
      AppService.warn('Line has already been explained');
      return res.status(200).json({ explanation: line.shortExplanation });
    }

    try {
      const explanation = await this.promptService.explainLineOfSpeech(line);

      return res.status(200).json({ explanation });
    } catch (error) {
      AppService.error('Cannot create explanation', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to call ai to explain a question in a practice test
   * @param res
   * @param header
   * @returns
   */
  @Get('/explain-question')
  async explainQuestion(@Res() res, @Query() query: { question_id: number }) {
    const question = await this.practiceService.getQuestionInPracticeById(
      query.question_id,
    );

    if (!question) {
      AppService.error('Question Not Found');
      return res.status(500).json(false);
    }

    if (question.shortExplanation) {
      AppService.warn('Question has already been explained');
      return res.status(200).json({ explanation: question.shortExplanation });
    }

    try {
      const explanation = await this.promptService.explainQuestion(question);

      return res.status(200).json({ explanation });
    } catch (error) {
      AppService.error('Cannot create explanation', error);
      return res.status(500).json(false);
    }
  }

  @Post('/conversations/suggested')
  async getSuggested(
    @Res() res,
    @Body()
    body: {
      liked_ids: number[];
      learnt_ids: number[];
      practiced_ids: number[];
    },
  ) {
    try {
      // GET CONVERSATIONS BY IDS
      const conIds = await this.promptService.getSuggestedConversations(
        body.liked_ids,
        body.learnt_ids,
        body.practiced_ids,
      );

      return res.status(200).json(conIds);
    } catch (error) {
      AppService.error('Cannot get paginated conversations by ids', error);
      return res.status(500).json(false);
    }
  }

  @Post('/ai-chat')
  async getAIChat(
    @Res() res,
    @Body() body: { role: string; content: string }[],
  ) {
    const response = await this.promptService.getAIChat(body);

    return res.status(200).json(response);
  }

  @Post('/update')
  async updatePrompt(
    @Res() res,
    @Body() body: { id: number; prompt: string },
    @Headers() header: { token: string },
  ) {
    // GET Admin AND BEFORE REQUESTING
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // FIND PROMPT BEFORE UPDATING
    const prompt = await this.promptService.getPromptById(body.id);

    if (!prompt) {
      AppService.error('Prompt Not Found');
      return res.status(500).json(false);
    }

    // VALIDATE PROMPT
    if (body.prompt.length / prompt.content.length < 0.5) {
      // REQUIRE 50% IN LENGTH
      AppService.error('INVALID PROMPT');
      return res.status(500).json(false);
    }

    prompt.content = body.prompt;
    prompt.count += 1;

    if (await this.promptService.update(prompt)) {
      return res.status(200).json(true);
    }

    AppService.error('Cannot update prompt');
    return res.status(500).json(false);
  }

  // STATIC METHODS
}
