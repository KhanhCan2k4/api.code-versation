import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppService } from 'src/app.service';
import { Prompt } from 'src/models/Prompt';
import { Account } from 'src/models/Account';
import configs from '../datas/configs.json';
import { AccountService } from './AccountService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Conversation } from 'src/models/Conversation';
import { ConversationService } from './ConversationService';
import { Topic } from 'src/models/Topic';
import { LineOfSpeech } from 'src/models/LineOfSpeech';
import { Question } from 'src/models/Question';
import { PracticeService } from './PracticeService';
import { TopicService } from './TopicService';
import { Marketing } from 'src/models/Marketing';
import { AIKey } from 'src/models/AIKey';

@Injectable()
export class PromptService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;
  private readonly MAX_LATEST_SUGGESTED_CONS = 9;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Prompt)
    protected readonly promptRepo: Repository<Prompt>,
    @InjectRepository(AIKey)
    protected readonly keyRepo: Repository<AIKey>,
    protected readonly accountService: AccountService,
    protected readonly conService: ConversationService,
    protected readonly topicService: TopicService,
    protected readonly practiceService: PracticeService,
  ) {}

  /** METHODS **/
  /**
   * to get all prompts
   * @returns Promise<Prompt[]>
   */
  async getAllPrompts(): Promise<Prompt[]> {
    const prompts = await this.promptRepo.find();
    return prompts;
  }

  /**
   * call ai to generate an ai assistant
   * @returns
   */
  async createAIAssistant(): Promise<Account | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.create_ai_assistant },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // PICK 1 ASSISTANT AI KEY TO FULFILL TASK
    const apiKey = await this.accountService.getActiveAIKey();
    // AppService.debug('aiKey', { apiKey });

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(apiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    const result = await model.generateContent(prompt.content);

    try {
      const account = PromptService.extractJsonFromAiResponse<Account>(
        result.response.text(),
      );
      return account;
    } catch (error) {
      AppService.error('Cannot create new ai assistant', error);
      return null;
    }
  }

  /**
   * call ai to generate a new topic
   * @returns
   */
  async createTopic(): Promise<Topic | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.create_topic },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // PICK 1 ASSISTANT AI KEY TO FULFILL TASK
    const apiKey = await this.accountService.getActiveAIKey();
    // AppService.debug('aiKey', { apiKey });

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(apiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // PREPARE DATA
    const oldTopics = await this.topicService.getPaginatedTopics(1, 10000, '');
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{OLD_TOPICS}}',
        inputData: oldTopics,
      },
    ]);

    const result = await model.generateContent(prompt.content);

    try {
      const topic = PromptService.extractJsonFromAiResponse<Topic>(
        result.response.text(),
      );
      return topic;
    } catch (error) {
      AppService.error('Cannot create new topic', error);
      return null;
    }
  }

  /**
   * call ai to generate a new marketing
   * @returns
   */
  async createMarketing(input: string): Promise<Marketing | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.marketing_prompt },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // PICK 1 ASSISTANT AI KEY TO FULFILL TASK
    const apiKey = await this.accountService.getActiveAIKey();
    // AppService.debug('aiKey', { apiKey });

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(apiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // PREPARE DATA
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{KEYWORD}}',
        inputData: input,
      },
    ]);

    const result = await model.generateContent(prompt.content);

    try {
      const marketing = PromptService.extractJsonFromAiResponse<Marketing>(
        result.response.text(),
      );
      return marketing;
    } catch (error) {
      AppService.error('Cannot create new marketing', error);
      return null;
    }
  }

  /**
   * call ai to generate a new conversation with a provided topic
   * @returns
   */
  async createConversation(topic: Topic): Promise<Conversation | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.create_conversation },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // PICK 1 ASSISTANT AI KEY TO FULFILL TASK
    const apiKey = await this.accountService.getActiveAIKey();
    // AppService.debug('aiKey', { apiKey });

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(apiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // PREPARE DATA
    const speakers = (
      await this.accountService.getAllAIAccounts(1, 10000, '')
    ).data.map((s) => ({
      id: s.id,
      name: s.name,
      shortDesc: s.shortDesc,
    }));

    // ADD DATA INTO PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{TOPIC}}',
        inputData: topic,
      },
      {
        key: '{{SPEAKERS}}',
        inputData: speakers,
      },
    ]);

    const result = await model.generateContent(prompt.content);

    // AppService.debug('result', result);

    try {
      const conversation =
        PromptService.extractJsonFromAiResponse<Conversation>(
          result.response.text(),
        );

      // ADD TOPIC ID BEFORE STORING INTO DATABASE
      conversation.topic = topic;
      conversation.topic_id = topic.id;

      // AppService.debug('conversation', conversation);

      // SAVE INTO DATABASE
      if (await this.conService.saveConversation(conversation)) {
        return conversation;
      }

      return null;
    } catch (error) {
      AppService.error('Cannot create new conversation', error);
      return null;
    }
  }

  /**
   * call ai to generate a new welcome conversation with a provided ai assistant
   * @returns
   */
  async createWelcomeConversation(
    account: Account,
  ): Promise<Conversation | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.create_welcome_conversation },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(account.aiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // ADD DATA INTO PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{SPEAKER}}',
        inputData: account,
      },
    ]);

    const result = await model.generateContent(prompt.content);

    // AppService.debug('result', result);

    try {
      const conversation =
        PromptService.extractJsonFromAiResponse<Conversation>(
          result.response.text(),
        );

      // ADD BEFORE STORING INTO DATABASE
      conversation.title = 'The Welcome conversation';
      conversation.shortDesc = 'To welcome and be showed on Home Page';

      // AppService.debug('conversation', conversation);

      // SAVE INTO DATABASE
      if (await this.conService.saveConversation(conversation)) {
        return conversation;
      }

      return null;
    } catch (error) {
      AppService.error('Cannot create new conversation', error);
      return null;
    }
  }

  /**
   * call ai to explain a sentence in a conversation
   * @returns
   */
  async explainLineOfSpeech(line: LineOfSpeech): Promise<string> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.explain_conversation },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return '';

    // GET ACTIVE KEY
    const activeKey = await this.getActiveKey();

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(activeKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // ADD DATA INTO PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{CONVERSATION}}',
        inputData: line.conversation,
      },
      {
        key: '{{TARGET_SENTENCE}}',
        inputData: line.content,
      },
    ]);

    const result = await model.generateContent(prompt.content);
    // AppService.debug('result', result);

    const explanation = result.response.text();

    // SAVE INTO DATABASE
    await this.conService.saveLineOfSpeech({
      ...line,
      shortExplanation: explanation,
    });

    return explanation;
  }

  /**
   * call ai to explain a sentence in a conversation
   * @returns
   */
  async explainQuestion(question: Question, account: Account): Promise<string> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.explain_question },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return '';

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(account.aiKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // ADD DATA INTO PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{QUESTION}}',
        inputData: question,
      },
    ]);

    const result = await model.generateContent(prompt.content);
    // AppService.debug('result', result);

    const explanation = result.response.text();

    // SAVE INTO DATABASE
    await this.practiceService.saveQuestionInPractice({
      ...question,
      shortExplanation: explanation,
    });

    return explanation;
  }

  async getSuggestedConversations(
    likedIds: number[],
    learntIds: number[],
    practicedIds: number[],
  ): Promise<number[]> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.sugguest_conversation },
    });

    // AppService.debug('prompt', { prompt });

    if (!prompt) return [];

    // GET ACTIVE KEY
    const activeKey = await this.getActiveKey();

    // CREATE AI OBJECT
    const ai = new GoogleGenerativeAI(activeKey);
    const model = ai.getGenerativeModel({ model: _configs.gemini_model });

    // PRE DATA
    const mapFunc = (c) => ({
      id: c.id,
      lines: c.lines.map((l) => l.content),
      title: c.title,
    });

    const latestCons = (
      await this.conService.getLatestConversations(
        this.MAX_LATEST_SUGGESTED_CONS,
        true,
      )
    ).map(mapFunc);

    const likedCons = (
      await this.conService.getConversationsByIds(likedIds, true)
    ).map(mapFunc);

    const learntCons = (
      await this.conService.getConversationsByIds(learntIds, true)
    ).map(mapFunc);

    const practicedCons = (
      await this.conService.getConversationsByIds(practicedIds, true)
    ).map(mapFunc);

    // BUILD PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{LATEST}}',
        inputData: latestCons,
      },
      {
        key: '{{LIKED}}',
        inputData: likedCons,
      },
      {
        key: '{{LEARNT}}',
        inputData: learntCons,
      },
      {
        key: '{{PRACTICED}}',
        inputData: practicedCons,
      },
    ]);

    // AppService.debug('prompt.content', { content: prompt.content });

    const result = await model.generateContent(prompt.content);

    // AppService.debug('result', result);

    try {
      const ids = PromptService.extractJsonFromAiResponse<number[]>(
        result.response.text(),
      );

      // AppService.debug('ids', ids);

      return ids;
    } catch (error) {
      AppService.error('Cannot suggest conversations', error);
      return [];
    }
  }

  /**
   * to update new prompt into databse
   * @param prompt
   * @returns
   */
  async update(prompt: Prompt): Promise<boolean> {
    try {
      await this.promptRepo.save(prompt);

      return true;
    } catch (error) {
      AppService.error('Cannot update prompt', error);
      return false;
    }
  }

  /**
   * to get a prompt from database with it's id
   * @param id
   * @returns
   */
  async getPromptById(id: number): Promise<Prompt | null> {
    try {
      const prompt = await this.promptRepo.findOne({ where: { id: id } });

      return prompt;
    } catch (error) {
      AppService.error('Cannot find prompt', error);
      return null;
    }
  }

  /**
   * to get the active keys
   * @returns
   */
  async getActiveKey(): Promise<string> {
    const _configs: typeof configs = require('../datas/configs.json');

    const activeKeys = await this.keyRepo.find({
      order: { createdAt: { direction: 'ASC' } },
      take: 1,
    });
    let activeKey: string;

    if (activeKeys.length === 0) {
      activeKey =
        _configs.default_gemini_keys[
          Math.floor(Math.random() * _configs.default_gemini_keys.length)
        ];
    } else {
      activeKey = activeKeys[0].key;
    }

    return activeKey;
  }

  async getAIChat(history: { role: string; content: string }[]): Promise<{
    reply: string;
    followUpSuggestions: string[];
    vnMeaning: string;
  } | null> {
    // GET PROMPT TO FULFILL THIS TASK
    const _configs: typeof configs = require('../datas/configs.json');
    const prompt = await this.promptRepo.findOne({
      where: { id: _configs.prompts.respond_chat },
    });
    // AppService.debug('prompt', { prompt });

    if (!prompt) return null;

    // CREATE AI OBJECT

    const activeKey = await this.getActiveKey();

    const ai = new GoogleGenerativeAI(activeKey);
    // AppService.debug('ai', ai);

    const model = ai.getGenerativeModel({ model: _configs.gemini_model });
    // AppService.debug('model', model);

    // ADD DATA INTO PROMPT
    prompt.content = PromptService.buildInputPrompt(prompt.content, [
      {
        key: '{{HISTORY}}',
        inputData: history,
      },
    ]);

    const result = await model.generateContent(prompt.content);
    // AppService.debug('result', result);

    try {
      const line = PromptService.extractJsonFromAiResponse<{
        reply: string;
        followUpSuggestions: string[];
        vnMeaning: string;
      }>(result.response.text());
      return line;
    } catch (error) {
      AppService.error('Cannot get repsonse as line of speech', error);
      return null;
    }
  }

  // STATIC METHODS

  /**
   * to create a string as JSON from a raw text
   * @param raw
   * @returns string
   */
  static extractJsonFromAiResponse<T>(raw: string): T {
    // Already clean JSON
    if (raw.startsWith('{')) {
      return JSON.parse(raw) as T;
    }

    // CLEANING
    const cleaned = raw
      .replace(/^```json/, '') // Remove starting ```json
      .replace(/^```/, '') // In case it uses plain ```
      .replace(/```$/, '') // Remove ending ```
      .trim(); // Remove extra space or newline

    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      AppService.error('Failed to parse AI response:', err);
      return '{}' as T;
    }
  }

  /**
   * to put input data into a prompt
   * @param basePrompt
   * @param datas
   * @returns string
   */
  static buildInputPrompt(
    basePrompt: string,
    datas: Array<{ key: string; inputData: object | string }>,
  ): string {
    let resultPrompt = basePrompt;

    datas.forEach((data) => {
      resultPrompt = resultPrompt.replace(
        data.key,
        typeof data.inputData === 'string'
          ? data.inputData
          : JSON.stringify(data.inputData, null, 2),
      );
    });

    return resultPrompt;
  }
}
