import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Comment } from 'src/models/Comment';
import { AppService } from 'src/app.service';

export enum Parent {
  CONVERSATION,
  QUESTION,
  LINE,
}

@Injectable()
export class CommentService {
  /** PROPERTIES **/
  private readonly MAX = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Comment)
    protected readonly commentRepo: Repository<Comment>,
  ) {}

  /**
   * get comments of its parent
   * @param of
   * @param id
   * @returns
   */
  async getCommentsOf(of: Parent, id: number): Promise<Comment[]> {
    let where: FindOptionsWhere<Comment> = {};

    switch (of) {
      case Parent.CONVERSATION:
        where = {
          conversation_id: id,
        };
        break;
      case Parent.QUESTION:
        where = {
          question_id: id,
        };
        break;
      case Parent.LINE:
        where = {
          line_id: id,
        };
        break;
    }

    const comments = await this.commentRepo.find({
      where,
      order: {
        likes: { direction: 'DESC' },
        dislikes: { direction: 'ASC' },
        createdAt: { direction: 'DESC' },
      },
      take: this.MAX,
    });

    return comments;
  }

  /**
   * to update like/dislike for comment
   * @param id
   * @param like
   * @param unlike
   * @param dislike
   * @param undislike
   * @returns
   */
  async upadteComment(
    id: number,
    like?: boolean,
    unlike?: boolean,
    dislike?: boolean,
    undislike?: boolean,
  ): Promise<boolean> {
    // GET COMMENT BY ID
    const comment = await this.commentRepo.findOne({ where: { id } });

    if (!comment) {
      AppService.error('Comment Not Found');
      return false;
    }

    if (like) {
      comment.likes += 1;
    }

    if (unlike) {
      if (comment.likes > 1) {
        comment.likes -= 1;
      } else {
        return false;
      }
    }

    if (dislike) {
      comment.dislikes += 1;
    }

    if (undislike) {
      if (comment.dislikes > 1) {
        comment.dislikes -= 1;
      } else {
        return false;
      }
    }

    try {
      await this.commentRepo.save(comment);
      return true;
    } catch (error) {
      AppService.error('Cannot update comment', error);
      return false;
    }
  }
}
