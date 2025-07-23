import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { AppService } from 'src/app.service';
import { Account } from 'src/models/Account';
import { Token } from 'src/models/Token';
import { Repository } from 'typeorm';

const EXPIRED_TIME_LENGTH = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TokenService {
  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Token)
    protected readonly tokenRepo: Repository<Token>,
  ) {}

  /** METHODS **/
  /**
   * to get a token object by token raw text
   * @param token
   * @returns Token
   */
  async getToken(token: string): Promise<Token | null> {
    if (!token) return null;

    // FIND FROM DATABASE
    const _token = await this.tokenRepo.findOne({
      where: { token: token },
      relations: ['account'],
    });

    // AppService.debug('_token', { _token });

    if (!_token) {
      return null;
    }

    return _token;
  }

  /**
   * to check a token that is existing or not
   * @param account
   * @param token
   * @returns boolean
   */
  async checkExistingTokenOfAccount(
    account: Account,
    token: string,
  ): Promise<boolean> {
    // CHECK INPUT PARAMS
    if (!account || !account.id || token) return false;

    // FIND FROM DATABASE
    const _token = await this.tokenRepo.findOne({
      where: { accountId: account.id, token: token },
    });

    if (!_token) {
      return false;
    }

    return true;
  }

  /**
   * to check a token that is expired or not
   * @param account
   * @param token
   * @returns boolean
   */
  async checkExpiringTokenOfAccount(
    account: Account,
    token: string,
  ): Promise<boolean> {
    // CHECK INPUT PARAMS
    if (!account || !account.id || token) return false;

    // FIND FROM DATABASE
    const _token = await this.tokenRepo.findOne({
      where: { accountId: account.id, token: token },
    });

    if (!_token) {
      return false;
    }

    if (
      _token.createdAt.getTime() <
      new Date().getTime() - EXPIRED_TIME_LENGTH
    ) {
      return false;
    }

    return true;
  }

  /**
   * to set a token to account
   * @param account
   * @returns
   */
  async setTokenToAccount(account: Account): Promise<string> {
    const token = TokenService.generateToken(account.name, account.email);

    let _token = this.tokenRepo.create({
      token: token,
      account: account,
      accountId: account.id,
    });

    try {
      _token = await this.tokenRepo.save(_token);

      return _token.token;
    } catch (error) {
      AppService.error('Cannot set token for account', error);
      throw new Error('Cannot set token for account', error);
    }
  }

  /** STATIC METHODS **/
  /**
   * to generate a new token for an account
   * @param username
   * @param email
   * @returns
   */
  static generateToken(username: string, email: string): string {
    const timestamp = Date.now(); // current time in ms
    const raw = `${username}:${email}:${timestamp}:${randomUUID()}`;
    return Buffer.from(raw).toString('base64url'); // base64url-safe string
  }
}
