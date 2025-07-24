import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { Marketing } from 'src/models/Marketing';
import PaginatedObject from 'src/models/PaginatedObject';
import { Topic } from 'src/models/Topic';
import { AccountService } from 'src/services/AccountService';
import { ImageService } from 'src/services/ImageService';
import { MarketingService } from 'src/services/MarketingService';
import { TopicService } from 'src/services/TopicService';

@Controller('/api/marketings')
export class MarketingController {
  /** PROPERTIES **/

  /** CONSTRUCTOR **/
  constructor(
    protected readonly marketingService: MarketingService,
    protected readonly accountService: AccountService,
  ) {}

  /** METHODS **/

  /**
   * to get all marketings
   */
  @Get('/paginated')
  getAllMarketings(
    @Res() res,
    @Query() query: { per_page: number; page: number; key: string },
  ) {
    const page = query.page || 1;
    const perPage = query.per_page || PaginatedObject.PER_PAGE;
    const key = query.key;

    // AppService.info('check pagination params', { page, perPage, key });

    this.marketingService
      .getPaginatedMarketings(page, perPage, key)
      .then((data) => {
        // AppService.debug('data', data);

        return res.status(200).json(data);
      })
      .catch((error) => res.status(500).json({ error }));
  }

  @Post('/store')
  async store(
    @Res() res,
    @Body() body: { marketing: Marketing },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      await this.marketingService.store(body.marketing);

      return res.status(200).json(true);
    } catch (error) {
      AppService.error('Cannot store marketing', error);
      return res.status(500).json(false);
    }
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
      const result = await this.marketingService.deleteByIds(body.ids);

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot delete marketings by their ids', error);
      return res.status(500).json(false);
    }
  }

  @Post('/ids')
  async getMarketingsByIds(
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
    const marketings = await this.marketingService.getMarketingsByIds(body.ids);

    return res.status(200).json(marketings);
  }

  /** STATIC METHODS **/
}
