import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppService } from 'src/app.service';
import { removeBackground } from '@imgly/background-removal';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/models/Account';
import { Like, Repository } from 'typeorm';
import { Topic } from 'src/models/Topic';

@Injectable()
export class ImageService {
  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Account)
    protected readonly accountRepo: Repository<Account>,
    @InjectRepository(Topic)
    protected readonly topicRepo: Repository<Topic>,
  ) {}

  /**
   * to get all images inside a folder
   * @param folderName
   * @returns
   */
  getAllImagesOfFolder(folderName: string): string[] {
    try {
      const folderPath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        folderName,
      );
      const fullPath = path.resolve(folderPath);
      const files = fs.readdirSync(fullPath);
      return files
        .filter(
          (file) =>
            (file.includes('.jpg') ||
              file.includes('.jpeg') ||
              file.includes('.png')) &&
            fs.statSync(path.join(fullPath, file)).isFile(),
        )
        .map((file) => `/${folderName}/${file}`)
        .sort();
    } catch (err) {
      console.error('Failed to read folder:', err);
      return [];
    }
  }

  async saveImageIntoFolder(
    folderName: string,
    file: Express.Multer.File,
  ): Promise<boolean> {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const designedName = `${uniqueSuffix}-${file.fieldname}${ext}`;

      const uploadFilePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        folderName,
        designedName,
      );

      //   const buffer = await this.removeBackground(file);
      const buffer = file.buffer;

      fs.writeFileSync(uploadFilePath, buffer);

      return true;
    } catch (error) {
      AppService.error('Cannot upload file', error);
      return false;
    }
  }

  /**
   * to remove a background
   * @param file
   * @returns buffer
   */
  removeBackground(
    file: Express.Multer.File,
  ): Promise<Buffer<ArrayBufferLike>> {
    const uint8Array = new Uint8Array(file.buffer);

    return removeBackground(uint8Array, {
      output: {
        format: 'image/png',
      },
    })
      .then((blob) => {
        return blob.arrayBuffer();
      })
      .then((arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer);

        return buffer;
      })
      .catch((error) => {
        AppService.error('Cannot remove background', error);
        return file.buffer;
      });
  }

  /**
   * move image into trash folder
   */
  async moveToTrash(imagePath: string): Promise<boolean> {
    // check used images
    if (
      (await this.accountRepo.exists({ where: { image: Like(imagePath) } })) ||
      (await this.topicRepo.exists({ where: { image: Like(imagePath) } }))
    ) {
      AppService.error('Image was used already');
      return false;
    }

    try {
      const oldPath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        imagePath,
      );

      const newPath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        'trash',
        imagePath,
      );

      fs.renameSync(oldPath, newPath);
      return true;
    } catch (error) {
      AppService.error('Cannot rename file', error);
      return false;
    }
  }

  /**
   * move image from trash to origin folder
   */
  async restoreFromTrash(imagePath: string): Promise<boolean> {
    try {
      const oldPath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        imagePath,
      );

      const newPath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        imagePath.replace('/trash', ''),
      );

      fs.renameSync(oldPath, newPath);
      return true;
    } catch (error) {
      AppService.error('Cannot restore file', error);
      return false;
    }
  }

  deleteImage(imagePath: string): boolean {
    try {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'images',
        imagePath,
      );

      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      AppService.error('Cannot delete file', error);
      return false;
    }
  }
}
