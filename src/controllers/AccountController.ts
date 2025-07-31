import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { AccountStatus, Status } from 'src/datas/enums/status';
import { Account } from 'src/models/Account';
import PaginatedObject from 'src/models/PaginatedObject';
import { AccountService } from 'src/services/AccountService';
import { ImageService } from 'src/services/ImageService';
import { OTPService } from 'src/services/OTPService';
import { Express } from 'express';
import { TopicService } from 'src/services/TopicService';
import { ConversationService } from 'src/services/ConversationService';
import { PromptService } from 'src/services/PromptService';
import { MarketingService } from 'src/services/MarketingService';
import { PracticeService } from 'src/services/PracticeService';

const THEME_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // yellow
  '#06b6d4', // cyan
  '#6b7280', // gray
];

type TrashItem = {
  table: string;
  id: number;
  data: string | object;
};

type SyncData = {
  likedConIds: number[];
  learntConIds: number[];
  practicedConIds: number[];
  suggestedConIds: number[];
  geminiKeys: string[];
};

@Controller('/api/accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly topicService: TopicService,
    private readonly mailService: MailerService,
    private readonly otpService: OTPService,
    protected readonly imageService: ImageService,
    protected readonly appService: AppService,
    protected readonly conService: ConversationService,
    protected readonly promptService: PromptService,
    protected readonly marService: MarketingService,
    protected readonly practiceService: PracticeService,
  ) {}

  /**
   * to get all ai accounts
   */
  @Get('/ai/paginated')
  getAllAIAccounts(@Req() req, @Res() res) {
    const page = parseInt(req.query.page as string) || 1;
    const perPage: number =
      parseInt(req.query.per_page as string) || PaginatedObject.PER_PAGE;
    const key = req.query.key as string;

    // AppService.info('check pagination params', { page, perPage, key });

    this.accountService
      .getAllAIAccounts(page, perPage, key)
      .then((accounts) => res.json(accounts))
      .catch((error) => res.status(500).json({ error }));
  }

  @Post('/ai')
  async getAIAccountsByIds(
    @Res() res,
    @Headers() header: { token: string },
    @Body() body: { ids: number[] },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    const accounts = await this.accountService.getAIAccountsByIDs(body.ids);
    return res.status(200).json(accounts);
  }

  /**
   * to get all avatars of ai accounts
   */
  @Get('/ai/images')
  async getAIAvatars(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    return res
      .status(200)
      .json(this.imageService.getAllImagesOfFolder('characters'));
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Res() res,
    @UploadedFile() image: Express.Multer.File,
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // CHECK FILE EXIST
    if (!image) {
      AppService.error('Image Not Uploaded');
      return res.status(500).json(false);
    }

    const result = await this.imageService.saveImageIntoFolder(
      'characters',
      image,
    );

    return res.status(200).json(result);
  }

  @Post('/delete-image')
  async deleteImage(
    @Res() res,
    @Body() body: { image: string },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // REMOVE IMAGE INTO TRASH
    const result = await this.imageService.moveToTrash(body.image);

    return res.status(200).json(result);
  }

  /**
   * to init an account
   * @param req
   * @param res
   * @returns
   */
  @Post('/init')
  initAccount(
    @Res() res,
    @Body() body: { username: string; email: string; ai_key: string },
  ) {
    // AppService.debug('body', body);
    //call service to store the account information
    this.accountService
      .init(body.username, body.email, body.ai_key)
      .then((data) => {
        // Init failed
        if (!data.result || !data.data) {
          AppService.error('Register unsuccessfully', data);
          return res.status(500).json(data);
        }

        // send email to ask user to active their account
        this.sendWelcomeMessage(data.data)
          .then((result) => {
            // SEND EMAIL UNSUCCESSFULLY
            if (!result) {
              AppService.error('Send email unsuccessfully');
              data.messages.push(
                'Your account was created but we cannot send active email for you. Please check later',
              );
              return res.status(500).json(data);
            }

            // SEND EMAIL SUCCESSFULLY
            AppService.success('Send email successfully');
            data.result = true;
            return res.status(200).json(data);
          })
          .catch((error) => {
            AppService.error('Send email unsuccessfully', error);
            data.messages.push(
              'Your account was created but we cannot send active email for you. Please check later',
            );
            return res.status(500).json(data);
          });
      })
      .catch((error) => {
        AppService.error('Init account unsuccessfully', error);
        return res.status(500);
      });
  }

  /**
   * to init an account
   * @param req
   * @param res
   * @returns
   */
  @Post('/init-assistant')
  async initAIAccount(
    @Res() res,
    @Body() body: { account: Account },
    @Headers() header: { token: string },
  ) {
    // AppService.debug('body', body);
    //call service to store the account information

    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // SET STATUS AS AN ASSISTANT FOR ACCOUNT
    body.account.status = AccountStatus.IS_AI;

    this.accountService
      .initAIAccount(body.account)
      .then((result) => {
        // Init failed
        if (!result) {
          AppService.error('Init account unsuccessfully');
          return res.status(500).json(false);
        }

        // send email to ask user to active their account
        return res.status(200).json(true);
      })
      .catch((error) => {
        AppService.error('Init account unsuccessfully', error);
        return res.status(500).json(false);
      });
  }

  /**
   * to init an account
   * @param req
   * @param res
   * @returns
   */
  @Put('/init-assistant')
  async updateAIAccount(
    @Res() res,
    @Body() body: { account: Account },
    @Headers() header: { token: string },
  ) {
    // AppService.debug('body', body);
    //call service to store the account information

    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // SET STATUS AS AN ASSISTANT FOR ACCOUNT
    body.account.status = AccountStatus.IS_AI;

    // CHECK FOR CREATING OR UPDATING
    const account = await this.accountService.getAIAccountByID(body.account.id);

    if (!account) {
      AppService.error('Accout Not Found');
      return res.status(500).json(false);
    }

    // AppService.debug('account', body.account);

    this.accountService
      .changeAIAccount(body.account)
      .then((result) => {
        // Init failed
        if (!result) {
          AppService.error('Update account unsuccessfully');
          return res.status(500).json(false);
        }

        return res.status(200).json(true);
      })
      .catch((error) => {
        AppService.error('Update account unsuccessfully', error);
        return res.status(500).json(false);
      });
  }

  /**
   * to login account with email and token/otp sent via email
   *
   * @param req
   * @param res
   * @returns
   */
  @Post('/login')
  login(@Res() res, @Body() body: { email: string; otp: number }) {
    AppService.debug('body', body);

    this.accountService
      .login(body.email, body.otp)
      .then((data) => {
        // Login failed
        if (!data.result || !data.data) {
          AppService.error('Login unsuccessfully');
          return res.status(500);
        }

        AppService.success('Login successfully');
        data.result = true;

        return res.status(200).json(data);
      })
      .catch((error) => {
        AppService.error('Login account unsuccessfully', error);
        return res.status(500);
      });
  }

  @Get('/login-with-token')
  async loginWithToken(@Res() res, @Headers() header: { token: string }) {
    // AppService.debug('header.token', { token: header.token });

    const account = await this.accountService.loginWithToken(header.token);

    // AppService.debug('Found account', account ?? {});

    if (!account) {
      AppService.error('Cannot login with token');
      return res.status(500);
    }

    return res.status(200).json(account);
  }

  @Get('/admin/login-with-token')
  async loginAdminWithToken(@Res() res, @Headers() header: { token: string }) {
    // AppService.debug('header.token', { token: header.token });

    const account = await this.accountService.loginAdminWithToken(header.token);

    // AppService.debug('Found account', account ?? {});

    if (!account) {
      AppService.error('Cannot login with token');
      return res.status(500).json(false);
    }

    return res.status(200).json(account);
  }

  @Post('/request-login')
  async requestLogin(@Res() res, @Body() body: { email: string }) {
    // GET ACCOUNT WITH EMAIL
    const account = await this.accountService.getAccountByEmail(body.email);

    if (!account) {
      AppService.error('Account not found!');
      return res.status(500).json(false);
    }

    // START REQUESTING
    const result = await this.sendOTPToLogin(account);

    if (!result) {
      AppService.error('Request unsuccessfully');
      return res.status(500).json(false);
    }
    AppService.success('Request successfully');
    return res.status(200).json(true);
  }

  @Get('/request-change-info')
  async requestChangeInfo(@Res() res, @Headers() header: { token: string }) {
    // GET ACCOUNT WITH TOKEN
    const account = await this.accountService.loginWithToken(header.token);

    // AppService.debug('account', { account });

    if (!account) {
      AppService.error('Account not found!');
      return res.status(500).json(false);
    }

    // START REQUESTING
    const result = await this.sendOTPToChangeInfo(account);

    if (!result) {
      AppService.error('Request unsuccessfully');
      return res.status(500).json(false);
    }
    AppService.success('Request successfully');
    return res.status(200).json(true);
  }

  @Post('/change-info')
  async changeInfo(
    @Res() res,
    @Body() body: { username: string; ai_key: string; otp: number },
    @Headers() header: { token: string },
  ) {
    AppService.debug('body', body);
    AppService.debug('token', { token: header.token });
    // GET ACCOUNT WITH TOKEN
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account not found!');
      return res.status(500).json(false);
    }

    const result = await this.accountService.changeInfo(
      body.username,
      body.ai_key,
      body.otp,
      account,
    );

    if (!result.result) {
      AppService.error('Cannot change information');
    }

    // AppService.debug("result", result);

    return res.status(200).json(result);
  }

  @Get('/maintain')
  checkAPIMode(@Res() res) {
    // GET THE MAINTAIN MODE
    const modeStatus = this.accountService.checkAPIMode();

    if (modeStatus) {
      return res.status(200).json(true);
    }

    AppService.debug('Maintainance Mode is on');
    return res.status(500).json(false);
  }

  @Post('/maintain')
  async changeMaintain(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // CALL SERVICE TO SET NEW MAINTAIN STATUS
    const result = this.accountService.setMaintainMode();
    return res.status(200).json(result);
  }

  @Get('/dashboard')
  async getDashboardItems(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // ACCOUNTS
    const userQuantity = await this.accountService.getAllUserQuantity();

    const aiQuantity = (await this.accountService.getAllAIAccounts(1, 1000, ''))
      .data.length;

    // TOPICS
    const topicQuantity = (
      await this.topicService.getPaginatedTopics(1, 10000, '')
    ).data.length;

    // CONVERSATIONS
    const conQuantity = (
      await this.conService.getPaginatedConversations(1, 100000, [-1, -1], '')
    ).data.length;

    // PROMPTS
    const promptQuantity = (await this.promptService.getAllPrompts()).length;

    // MARKETING
    const marQuantity = (
      await this.marService.getPaginatedMarketings(1, 100000, '')
    ).data.length;

    // MAINTAINACE
    const maintainStatus = this.accountService.checkAPIMode() ? 200 : 404;

    // LOGS
    const logQuantity = (await this.appService.readAllLogs()).length;

    // TRASH
    const imagesOfCharacters =
      this.imageService.getAllImagesOfFolder('trash/characters');
    const imagesOfTopics =
      this.imageService.getAllImagesOfFolder('trash/topics');
    const accounts = await this.accountService.getDeletedAIAccounts();
    const topics = await this.topicService.getDeletedTopics();
    const conversations = await this.conService.getDeletedConversations();
    const marketings = await this.marService.getDeletedMarketings();

    const trashQuantity =
      imagesOfCharacters.length +
      imagesOfTopics.length +
      accounts.length +
      topics.length +
      conversations.length +
      marketings.length;

    return res.status(200).json({
      user: userQuantity,
      ai: aiQuantity,
      topic: topicQuantity,
      con: conQuantity,
      prompt: promptQuantity,
      log: logQuantity,
      trash: trashQuantity,
      maintain: maintainStatus,
      marketing: marQuantity,
    });
  }

  @Get('/trash')
  async getAllTrashItems(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    const trashItems: TrashItem[] = [];
    // GET IMAGES IN TRASH
    const imagesOfCharacters =
      this.imageService.getAllImagesOfFolder('trash/characters');

    // AppService.debug('imagesOfCharacters', imagesOfCharacters);

    const imagesOfTopics =
      this.imageService.getAllImagesOfFolder('trash/topics');

    // AppService.debug('imagesOfTopics', imagesOfTopics);

    // GET DELETED AI ACCOUNTS
    const accounts = await this.accountService.getDeletedAIAccounts();

    // AppService.debug('accounts', accounts);

    // GET DELETED TOPICS
    const topics = await this.topicService.getDeletedTopics();

    // AppService.debug('topics', topics);

    // GET DELETED CONVERSATIONS
    const cons = await this.conService.getDeletedConversations();

    // AppService.debug('cons', cons);

    // GET DELETED MARKETINGS
    const mars = await this.marService.getDeletedMarketings();

    // AppService.debug('mars', mars);

    // ADD DATA TO LIST
    accounts.forEach((account) => {
      trashItems.push({
        id: account.id,
        table: 'accounts',
        data: account,
      });
    });

    topics.forEach((topic) => {
      trashItems.push({
        id: topic.id,
        table: 'topics',
        data: topic,
      });
    });

    cons.forEach((conversation) => {
      trashItems.push({
        id: conversation.id,
        table: 'conversations',
        data: conversation,
      });
    });

    mars.forEach((marketing) => {
      trashItems.push({
        id: marketing.id,
        table: 'marketings',
        data: marketing,
      });
    });

    imagesOfCharacters.forEach((image, index) => {
      trashItems.push({
        id: index,
        table: 'images',
        data: image,
      });
    });

    imagesOfTopics.forEach((image, index) => {
      trashItems.push({
        id: index,
        table: 'images',
        data: image,
      });
    });

    // RETURN RESULT
    return res.status(200).json(trashItems);
  }

  @Post('/')
  async deleteByIds(
    @Res() res,
    @Headers() header: { token: string },
    @Body() body: { ids: number[] },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // START DELETING
    try {
      const result = await this.accountService.deleteWithIds(body.ids);

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot delete ai accounts by their ids', error);
      return res.status(500).json(false);
    }
  }

  @Post('/delete-trash')
  async deleteTrashForever(
    @Res() res,
    @Body() body: { scope: string; id: number; data: string },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // DELETE IMAGE
    if (body.scope === 'images') {
      const result = this.imageService.deleteImage(body.data);

      return res.status(200).json(result);
    }

    // DELETE ACCOUNTS
    if (body.scope === 'accounts') {
      // GET DELETED ACCOUNT
      const account = await this.accountService.getAIAccountByID(body.id);

      if (!account) {
        AppService.error('Account Not Found');
        return res.status(500).json(false);
      }

      // DELETE ACCOUNT
      const result = await this.accountService.delete(account);

      return res.status(200).json(result);
    }

    // DELETE TOPICS
    if (body.scope === 'topics') {
      // GET DELETED TOPIC
      const topic = await this.topicService.getTopicById(body.id);

      if (!topic) {
        AppService.error('Topic Not Found');
        return res.status(500).json(false);
      }

      // DELETE TOPIC
      const result = await this.topicService.delete(topic);

      return res.status(200).json(result);
    }

    // DELETE CONVERSATIONS
    if (body.scope === 'conversations') {
      // GET DELETED CONVERSATION
      const con = await this.conService.getConversationById(body.id);

      if (!con) {
        AppService.error('Conversation Not Found');
        return res.status(500).json(false);
      }

      // DELETE CONVERSATION
      const result = await this.conService.delete(con);

      return res.status(200).json(result);
    }

    // DELETE MARKETINGS
    if (body.scope === 'marketings') {
      // GET DELETED MARKETING
      const mar = await this.marService.getMarketingById(body.id);

      if (!mar) {
        AppService.error('Marketing Not Found');
        return res.status(500).json(false);
      }

      // DELETE MARKETING
      const result = await this.marService.delete(mar);

      return res.status(200).json(result);
    }

    return res.status(404).json(false);
  }

  @Post('/restore-trash')
  async restoreTrash(
    @Res() res,
    @Body() body: { scope: string; id: number; data: string },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // RESTORE IMAGE
    if (body.scope === 'images') {
      const result = await this.imageService.restoreFromTrash(body.data);

      return res.status(200).json(result);
    }

    // RESTORE ACCOUNTS
    if (body.scope === 'accounts') {
      // GET ACCOUNT TO RESTORE
      const account = await this.accountService.getAIAccountByID(body.id);

      if (!account) {
        AppService.error('Account Not Found');
        return res.status(500).json(false);
      }

      // CHANGE STATUS
      account.status = AccountStatus.IS_AI;
      const result = await this.accountService.changeAIAccount(account);

      return res.status(200).json(result);
    }

    // RESTORE TOPICS
    if (body.scope === 'topics') {
      // GET RESTORED TOPIC BY ID
      const topic = await this.topicService.getTopicById(body.id);

      if (!topic) {
        AppService.error('Topic Not Found');
        return res.status(500).json(false);
      }

      // CHANGE THE STATUS
      topic.status = Status.ACTIVE;
      const result = await this.topicService.store(topic);

      return res.status(200).json(result);
    }

    // RESTORE CONVERSATIONS
    if (body.scope === 'conversations') {
      // GET RESTORED CONVERSATION BY ID
      const con = await this.conService.getConversationById(body.id);

      if (!con) {
        AppService.error('Conversation Not Found');
        return res.status(500).json(false);
      }

      // CHANGE THE STATUS
      con.status = Status.ACTIVE;
      const result = await this.conService.saveConversations([con]);

      return res.status(200).json(result);
    }

    // RESTORE MARKETINGS
    if (body.scope === 'marketings') {
      // GET RESTORED TOPIC BY ID
      const marketing = await this.marService.getMarketingById(body.id);

      if (!marketing) {
        AppService.error('Marketing Not Found');
        return res.status(500).json(false);
      }

      // CHANGE THE STATUS
      marketing.status = Status.ACTIVE;
      const result = await this.marService.store(marketing);

      return res.status(200).json(result);
    }

    return res.status(404).json(false);
  }

  @Get('/logs')
  async getAllLogs(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // GET ALL LOGS
    const logs = await this.appService.readAllLogs();

    return res.status(200).json(logs);
  }

  @Post('/sync')
  async syncUserData(
    @Res() res,
    @Headers() header: { token: string },
    @Body() body: SyncData,
  ) {
    // CHECK ACCOUNT
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(500);
    }

    try {
      await this.conService.syncLikedIds(account, body.likedConIds);

      await this.conService.syncLearntIds(account, body.learntConIds);

      await this.conService.syncPracticedIds(account, body.practicedConIds);

      await this.accountService.syncAIKeys(account, body.geminiKeys);

      return res.status(200).json(true);
    } catch (error) {
      AppService.error('Cannot get sync data', error);
      return res.status(500).json(false);
    }
  }

  @Post('/save-key')
  async saveKey(
    @Res() res,
    @Body() body: { key: string },
    @Headers() header: { token: string },
  ) {
    // CHECK ACCOUNT
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(403).json(false);
    }

    const result = await this.accountService.saveKey(account, body.key);

    return res.status(200).json(result);
  }

  @Get('/api-keys')
  async getAPIKeys(@Res() res, @Headers() header: { token: string }) {
    // CHECK ACCOUNT
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(403).json(false);
    }

    // GET API KEYS
    const keys = await this.accountService.getAIKeysOfAccount(account);

    return res.status(200).json(keys);
  }

  /**
   * to send welcome message for first access account
   * @param account
   * @returns
   */
  async sendWelcomeMessage(account: Account): Promise<boolean> {
    //prepare data
    const THEME_COLOR =
      THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
    const APP_NAME = 'CODE-VERSATIONS';
    const CURRENT_YEAR = new Date().getFullYear();
    const USERNAME = account.name.toUpperCase();
    const DASHBOARD_LINK = 'http://localhost:5173/';

    const sendMailOptions: ISendMailOptions = {
      to: account.email,
      subject: 'WELCOME TO ' + APP_NAME,
      template: 'welcome',
      context: {
        THEME_COLOR,
        APP_NAME,
        CURRENT_YEAR,
        USERNAME,
        DASHBOARD_LINK,
      },
    };

    //send email
    try {
      await this.mailService.sendMail(sendMailOptions);
      AppService.success(`Email sent to ${account.email}`);
      return true;
    } catch (error) {
      AppService.error(`Error sending email to ${account.email}:`, error);
      return false;
    }
  }

  /**
   * to send otp via email for confirming login
   * @param account
   * @returns
   */
  async sendOTPToLogin(account: Account): Promise<boolean> {
    //prepare data
    const THEME_COLOR =
      THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
    const APP_NAME = 'CODE-VERSATIONS';
    const OTP_CODE = (await this.otpService.setOTPForAccount(account)).otp;
    const CURRENT_YEAR = new Date().getFullYear();

    const sendMailOptions: ISendMailOptions = {
      to: account.email,
      subject: 'OTP FOR LOGIN INTO ' + APP_NAME,
      template: 'otp_login',
      context: {
        THEME_COLOR,
        OTP_CODE,
        CURRENT_YEAR,
        APP_NAME,
      },
    };

    //send email
    try {
      await this.mailService.sendMail(sendMailOptions);
      AppService.success(`Email sent to ${account.email}`);
      return true;
    } catch (error) {
      AppService.error(`Error sending email to ${account.email}:`, error);
      return false;
    }
  }

  /**
   * to send otp via email for confriming changing information
   * @param account
   * @returns
   */
  async sendOTPToChangeInfo(account: Account): Promise<boolean> {
    //prepare data
    const THEME_COLOR =
      THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
    const APP_NAME = 'CODE-VERSATIONS';
    const OTP_CODE = (await this.otpService.setOTPForAccount(account)).otp;
    const CURRENT_YEAR = new Date().getFullYear();

    const sendMailOptions: ISendMailOptions = {
      to: account.email,
      subject: 'OTP FOR CHANGING INFORMATION AT ' + APP_NAME,
      template: 'otp_change_info',
      context: {
        THEME_COLOR,
        OTP_CODE,
        CURRENT_YEAR,
        APP_NAME,
      },
    };

    //send email
    try {
      await this.mailService.sendMail(sendMailOptions);
      AppService.success(`Email sent to ${account.email}`);
      return true;
    } catch (error) {
      AppService.error(`Error sending email to ${account.email}:`, error);
      return false;
    }
  }
}
