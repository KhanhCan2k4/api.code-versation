import {
  Body,
  Controller,
  Delete,
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
import PaginatedObject from 'src/models/PaginatedObject';
import { Topic } from 'src/models/Topic';
import { AccountService } from 'src/services/AccountService';
import { ImageService } from 'src/services/ImageService';
import { TopicService } from 'src/services/TopicService';

@Controller('/api/topics')
export class TopicController {
  /** PROPERTIES **/

  /** CONSTRUCTOR **/
  constructor(
    protected readonly topicService: TopicService,
    protected readonly accountService: AccountService,
    protected readonly imageService: ImageService,
  ) {}

  /** METHODS **/

  /**
   * to get all languages that are supported in app
   */
  @Get('/paginated')
  getAllSupportedLanguages(
    @Res() res,
    @Query() query: { per_page: number; page: number; key: string },
  ) {
    const page = query.page || 1;
    const perPage = query.per_page || PaginatedObject.PER_PAGE;
    const key = query.key;

    // AppService.info('check pagination params', { page, perPage, key });

    this.topicService
      .getPaginatedTopics(page, perPage, key)
      .then((data) => {
        // AppService.debug('data', data);

        return res.json(data);
      })
      .catch((error) => res.status(500).json({ error }));
  }

  @Post('/store')
  async store(
    @Res() res,
    @Body() body: { topic: Topic },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    try {
      await this.topicService.store(body.topic);

      return res.status(200).json(true);
    } catch (error) {
      AppService.error('Cannot store topic', error);
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
      const result = await this.topicService.deleteByIds(body.ids);

      return res.status(200).json(result);
    } catch (error) {
      AppService.error('Cannot delete topics by their ids', error);
      return res.status(500).json(false);
    }
  }

  /**
   * to get all background covers of topics
   */
  @Get('/images')
  async getBackgroundCovers(@Res() res, @Headers() header: { token: string }) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    return res
      .status(200)
      .json(this.imageService.getAllImagesOfFolder('topics'));
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
      'topics',
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

  /** STATIC METHODS **/
}
