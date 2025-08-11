import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Status } from 'src/datas/enums/status';
import { AccountService } from 'src/services/AccountService';
import { ConversationService } from 'src/services/ConversationService';

@Controller('/api/conversations')
export class ConversationController {
  // CONSTRUCTOR
  constructor(
    private readonly conService: ConversationService,
    private readonly accountService: AccountService,
  ) {}

  //   METHODS
  @Post('/paginated')
  async getPaginated(
    @Res() res,
    @Body()
    body: {
      page: number;
      per_page: number;
      excluded_ids: number[];
      liked_ids: number[];
      key: string;
      attached_welcome: boolean;
      lang: string;
    },
  ) {
    AppService.debug('body', body);

    try {
      const data = await this.conService.getPaginatedConversations(
        body.page ?? 1,
        body.per_page,
        body.excluded_ids,
        body.key,
        body.attached_welcome,
        body.lang,
      );

      return res.status(200).json(data);
    } catch (error) {
      AppService.error('Cannot get paginated list of conversations', error);
      return res.status(500).json(false);
    }
  }

  @Post('/ids/paginated')
  async getPaginatedByIds(
    @Res() res,
    @Body()
    body: {
      page: number;
      per_page: number;
      ids: number[];
    },
  ) {
    try {
      AppService.debug('body', body);

      if (body.ids.length === 0) {
        AppService.error(
          'Cannot get paginated conversations by empty list of ids',
        );
        return res.status(500).json(false);
      }

      // GET CONVERSATIONS BY IDS
      const cons = await this.conService.getPaginatedConversationsByIds(
        body.page ?? 1,
        body.per_page,
        body.ids,
      );

      return res.status(200).json(cons);
    } catch (error) {
      AppService.error('Cannot get paginated conversations by ids', error);
      return res.status(500).json(false);
    }
  }

  @Post('/liked/paginated')
  async getPaginatedLiked(
    @Res() res,
    @Body() body: { ids: number[]; page?: number; per_page?: number },
  ) {
    const result = await this.conService.getPaginatedConversationsByIds(
      body.page,
      body.per_page,
      body.ids,
    );

    return res.status(200).json(result);
  }

  @Post('/learnt/paginated')
  async getPaginatedLearnt(
    @Res() res,
    @Body() body: { ids: number[]; page?: number; per_page?: number },
    @Headers() header: { token: string },
  ) {
    const result = await this.conService.getPaginatedConversationsByIds(
      body.page,
      body.per_page,
      body.ids,
    );

    return res.status(200).json(result);
  }

  @Post('/delete')
  async deleteByIds(
    @Res() res,
    @Body() body: { ids: number[] },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // GET BY IDS
    const conversations = await this.conService.getConversationsByIds(body.ids);

    // SET NEW STATUS
    conversations.forEach((con) => {
      con.status = Status.DELETED;
    });

    try {
      const result = await this.conService.saveConversations(conversations);

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot delete conversations with ids', error);
      return res.status(500).json(false);
    }
  }

  @Get('/welcome')
  async getWelcome(@Res() res, @Query() query: { lang: string }) {
    const { conversation, lang } = await this.conService.getWelcomeConversation(
      query.lang,
    );

    if (!conversation) {
      AppService.error('Cannot get welcome conversation');
      return res.status(500);
    }

    AppService.success('Get welcome conversation successfully');
    return res.status(200).json({ con: conversation, lang });
  }

  @Get('/')
  async getConversationById(@Res() res, @Query() query: { id: number }) {
    const conversation = await this.conService.getConversationById(query.id);

    if (!conversation) {
      AppService.error('Cannot get conversation with id');
      return res.status(500).json(false);
    }

    AppService.success('Get conversation with id successfully');
    return res.status(200).json(conversation);
  }

  @Post('/lines')
  async getLines(@Res() res, @Body() body: { ids: number[] }) {
    AppService.debug('ids', body.ids);

    const lines = await this.conService.getLinesByIds(body.ids);

    return res.status(200).json(lines);
  }

  @Put('')
  async updateLikeOrView(
    @Res() res,
    @Query()
    query: {
      id: number;
      like?: boolean;
      unlike?: boolean;
      view?: boolean;
      unview?: boolean;
    },
    @Headers() header: { token: string },
  ) {
    // GET ACCOUNT WITH TOKEN
    const account = await this.accountService.loginWithToken(header.token);

    if (!account) {
      AppService.error('Account Not Found');
      return res.status(403).json(false);
    }
  }

  // STATIC METHODS
}
