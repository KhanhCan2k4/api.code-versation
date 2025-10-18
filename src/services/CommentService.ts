import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { Comment } from 'src/models/Comment';
import { AppService } from 'src/app.service';
import { Account } from 'src/models/Account';

export enum Parent {
  CONVERSATION,
  QUESTION,
  LINE,
}

@Injectable()
export class CommentService {
  /** PROPERTIES **/

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
      where: { ...where, likes: MoreThan(-1), dislikes: MoreThan(-1) },
      order: {
        likes: { direction: 'DESC' },
        dislikes: { direction: 'ASC' },
        createdAt: { direction: 'DESC' },
      },
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
      if (comment.likes > 0) {
        comment.likes -= 1;
      } else {
        return false;
      }
    }

    if (dislike) {
      comment.dislikes += 1;
    }

    if (undislike) {
      if (comment.dislikes > 0) {
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

  /**
   * to add a new comment
   * @param comment
   * @param of
   * @param id
   * @returns
   */
  async addComment(
    comment: string,
    of: Parent,
    id: number,
    account: Account,
    isReport?: boolean,
  ): Promise<Comment | null> {
    const _comment = new Comment();
    _comment.content = comment;
    _comment.account_id = account.id;

    if (isReport) {
      _comment.likes = -1;
      _comment.dislikes = -1;
    }

    switch (of) {
      case Parent.CONVERSATION:
        _comment.conversation_id = id;
        break;
      case Parent.QUESTION:
        _comment.question_id = id;
        break;
      case Parent.LINE:
        _comment.line_id = id;
        break;
    }

    // AppService.debug('comment', _comment);

    try {
      const savedComment = await this.commentRepo.save(_comment);
      return savedComment;
    } catch (error) {
      AppService.error('Cannot save new comment', error);
      return null;
    }
  }
}
