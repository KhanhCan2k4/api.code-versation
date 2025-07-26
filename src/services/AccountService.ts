import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { Account } from 'src/models/Account';
import PaginatedObject from 'src/models/PaginatedObject';
import UpdatedResponseObject from 'src/models/UpdatedResponseObject';
import { In, Not, Repository } from 'typeorm';
import { OTPService } from './OTPService';
import { TokenService } from './TokenService';
import configs from '../datas/configs.json';
import { AccountStatus, Status } from 'src/datas/enums/status';
import * as fs from 'fs';
import * as path from 'path';

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9 ]{2,15}[a-zA-Z0-9]$/;

const AI_KEY_REGEX = /^AIza[0-9A-Za-z\-_]{35}$/;

const TOKEN_REGEX = /^[A-Za-z0-9\-_]+$/;

const OTP_REGEX = /^[1-9][0-9]{5}$/;

@Injectable()
export class AccountService {
  /** PROPERTIES **/
  private readonly PER_PAGE = 10;

  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(Account)
    protected readonly accountRepo: Repository<Account>,
    protected readonly otpService: OTPService,
    protected readonly tokenService: TokenService,
  ) {}

  /** METHODS **/
  /**
   * to get all ai account
   *
   * @param page page
   * @param perPage
   * @param key
   * @returns Promise<PaginatedObject<Account>>
   */
  async getAllAIAccounts(
    page: number = 1,
    perPage: number = this.PER_PAGE,
    key?: string,
  ): Promise<PaginatedObject<Account>> {
    try {
      const totalData = await this.accountRepo.count();

      if (perPage < 1) {
        throw new Error('Invalid per page');
      }

      const lastPage = Math.ceil((totalData * 1.0) / perPage);

      if (page < 1 || page > lastPage) {
        throw new Error('Invalid page');
      }
    } catch (e) {
      throw new Error('Invalid paginated options');
    }

    const qb = this.accountRepo.createQueryBuilder('accounts');
    const skip = (page - 1) * perPage;
    const take = perPage;

    qb.where('accounts.status = :status', { status: AccountStatus.IS_AI });

    if (key) {
      qb.where('accounts.name LIKE :key', { key: `%${key}%` })
        .orWhere('accounts.email LIKE :key', { key: `%${key}%` })
        .orWhere('accounts.short_desc LIKE :key', { key: `%${key}%` });
    }

    try {
      const [accounts, total] = await qb
        .skip(skip)
        .take(take)
        .orderBy('updated_at', 'DESC')
        .addOrderBy('name', 'ASC')
        .getManyAndCount();

      return new PaginatedObject(page, perPage, key, total, accounts);
    } catch (e) {
      throw new Error('Cannot find');
    }
  }

  /**
   * to get quantity of users
   */
  async getAllUserQuantity(): Promise<number> {
    try {
      const quantity = await this.accountRepo.count();

      return quantity;
    } catch (error) {
      AppService.error('Cannot read all quantity of users', error);
      return 0;
    }
  }

  /**
   * get account by email address
   *
   * @param email
   * @returns Account | null
   */
  async getAccountByEmail(email: string): Promise<Account | null> {
    return await this.accountRepo.findOne({ where: { email: email } });
  }

  /**
   * get account by provided token
   * @param token
   * @returns
   */
  async getAccountByToken(token: string): Promise<Account | null> {
    // VALIDATE TOKEN
    if (!AccountService.validateToken(token)) {
      return null;
    }

    // CHECK EXISTING TOKEN
    const actualToken = await this.tokenService.getToken(token);

    if (!actualToken) return null;

    return actualToken.account;
  }

  /**
   * get ai account by provided id
   * @param id
   * @returns
   */
  async getAIAccountByID(id: number): Promise<Account | null> {
    const account = await this.accountRepo.findOne({
      where: {
        id: id,
        status: In([AccountStatus.IS_AI, AccountStatus.IS_AI_DELETED]),
      },
    });

    return account;
  }

  /**
   * get ai account by provided id
   * @param id
   * @returns
   */
  async getAIAccountsByIDs(ids: number[]): Promise<Account[]> {
    const accounts = await this.accountRepo.find({
      where: { id: In(ids), status: AccountStatus.IS_AI },
    });

    return accounts;
  }

  /**
   * to create a new account
   * @param username
   * @param email
   * @param aiKey
   * @returns
   */
  async init(
    username: string,
    email: string,
    aiKey: string,
  ): Promise<UpdatedResponseObject<Account>> {
    // RESPONSE OBJECT
    const result = new UpdatedResponseObject<Account>(false);

    //VALIDATE USERNAME
    if (!AccountService.validateUserName(username)) {
      result.messages.push('Invalid Username');
    }

    // VALIDATE EMAIL
    if (!AccountService.validateEmail(email)) {
      result.messages.push('Invalid Email');
    }

    // VALIDATE API KEY (ONLY WHEN USER PASS AI KEY)
    if (aiKey && !AccountService.validateAIKey(aiKey)) {
      result.messages.push('Invalid AI Key');
    }

    if (result.messages.length > 0) {
      return result;
    }

    // CHECK UNIQUE ACCOUNT
    let account: Account | null;
    account = await this.accountRepo.findOne({ where: { email } });
    if (account) {
      result.messages.push('Email already exist');
      return result;
    }

    // CHECK UNIQUE API KEY (ONLY WHEN USER PASS AI KEY)
    if (aiKey) {
      account = await this.accountRepo.findOne({ where: { aiKey: aiKey } });
      if (account) {
        result.messages.push('AI Key already exist');
        return result;
      }
    }

    // AppService.info('messages', result.messages);

    try {
      // CREATE AND STORE ACCOUNT INTO DATABASE
      account = await this.accountRepo.create({ email, name: username, aiKey });
      account = await this.accountRepo.save(account);

      // SET RESULT
      result.result = true;
      result.messages = ['Create new acount successfully'];
      result.data = account;

      return result;
    } catch (error) {
      // HANDLE ERROR
      result.messages = ['Server Found Error. Please try later'];
      AppService.error('Init account failed', error);
      return result;
    }
  }

  /**
   * to delete ai account forever
   */
  async delete(account: Account): Promise<boolean> {
    try {
      await this.accountRepo.remove(account);

      return true;
    } catch (error) {
      AppService.error('Cannot delete account', error);
      return false;
    }
  }

  /**
   * soft delete, set status as deleted with ai accounts with their ids
   */
  async deleteWithIds(ids: number[]): Promise<boolean> {
    // CHECK EXIST IDS
    let accounts: Account[] = [];

    try {
      accounts = await this.accountRepo.find({
        where: { id: In(ids), status: AccountStatus.IS_AI },
      });
    } catch (error) {
      AppService.debug('Cannot get ai accounts with their ids', error);
      return false;
    }

    if (accounts.length !== ids.length) {
      AppService.error('List of ids has not found accouns(s)');
      return false;
    }

    accounts.forEach((account) => {
      account.status = AccountStatus.IS_AI_DELETED;
    });
    try {
      await this.accountRepo.save(accounts);

      return true;
    } catch (error) {
      AppService.error('Cannot set deleted status for accounts', error);
      return false;
    }
  }

  /**
   * to create a new account
   * @param account
   * @returns
   */
  async initAIAccount(account: Account): Promise<boolean> {
    // RESPONSE OBJECT
    const result = new UpdatedResponseObject<Account>(false);

    //VALIDATE USERNAME
    if (!AccountService.validateUserName(account.name)) {
      result.messages.push('Invalid Username');
    }

    // VALIDATE EMAIL
    if (!AccountService.validateEmail(account.email)) {
      result.messages.push('Invalid Email');
    }

    // VALIDATE API KEY (ONLY WHEN USER PASS AI KEY)
    if (account.aiKey && !AccountService.validateAIKey(account.aiKey)) {
      result.messages.push('Invalid AI Key');
    }

    if (result.messages.length > 0) {
      return false;
    }

    // CHECK UNIQUE ACCOUNT
    if (await this.accountRepo.findOne({ where: { email: account.email } })) {
      result.messages.push('Email already exist');
      return false;
    }

    // CHECK UNIQUE API KEY (ONLY WHEN USER PASS AI KEY)
    if (await this.accountRepo.findOne({ where: { aiKey: account.aiKey } })) {
      result.messages.push('AI Key already exist');
      return false;
    }

    // AppService.info('messages', result.messages);

    try {
      // CREATE AND STORE ACCOUNT INTO DATABASE
      account = await this.accountRepo.save(account);

      // SET RESULT
      result.result = true;
      result.messages = ['Create new acount successfully'];
      result.data = account;

      return true;
    } catch (error) {
      // HANDLE ERROR
      result.messages = ['Server Found Error. Please try later'];
      AppService.error('Init account failed', error);
      return false;
    }
  }

  /**
   * to change an account
   * @param account
   * @returns
   */
  async changeAIAccount(account: Account): Promise<boolean> {
    // RESPONSE OBJECT
    const result = new UpdatedResponseObject<Account>(false);

    //VALIDATE USERNAME
    if (!AccountService.validateUserName(account.name)) {
      result.messages.push('Invalid Username');
    }

    // VALIDATE EMAIL
    if (!AccountService.validateEmail(account.email)) {
      result.messages.push('Invalid Email');
    }

    // VALIDATE API KEY (ONLY WHEN USER PASS AI KEY)
    if (account.aiKey && !AccountService.validateAIKey(account.aiKey)) {
      result.messages.push('Invalid AI Key');
    }

    // AppService.debug("error", result);

    if (result.messages.length > 0) {
      return false;
    }

    // CHECK UNIQUE ACCOUNT
    if (
      await this.accountRepo.findOne({
        where: { email: account.email, id: Not(account.id) },
      })
    ) {
      result.messages.push('Email already exist');
      return false;
    }

    // CHECK UNIQUE API KEY (ONLY WHEN USER PASS AI KEY)
    if (
      await this.accountRepo.findOne({
        where: { aiKey: account.aiKey, id: Not(account.id) },
      })
    ) {
      result.messages.push('AI Key already exist');
      return false;
    }

    // AppService.info('messages', result.messages);

    try {
      // CREATE AND STORE ACCOUNT INTO DATABASE
      account = await this.accountRepo.save(account);

      // SET RESULT
      result.result = true;
      result.messages = ['Update acount successfully'];
      result.data = account;

      return true;
    } catch (error) {
      // HANDLE ERROR
      result.messages = ['Server Found Error. Please try later'];
      AppService.error('Update account failed', error);
      return false;
    }
  }

  /**
   * to login an account
   * @param email
   * @param otp
   * @returns
   */
  async login(
    email: string,
    otp: number,
  ): Promise<UpdatedResponseObject<{ account: Account; token: string }>> {
    // RESPONSE OBJECT
    const result = new UpdatedResponseObject<{
      account: Account;
      token: string;
    }>(false);

    // VALIDATE EMAIL
    if (!AccountService.validateEmail(email)) {
      result.messages.push('Invalid Email');
    }

    // VALIDATE TOKEN
    if (!AccountService.validateOTP(otp)) {
      result.messages.push('Invalid OTP');
    }

    if (result.messages.length > 0) {
      return result;
    }

    // CHECK EXISTING ACCOUNT
    let account: Account | null;
    account = await this.accountRepo.findOne({ where: { email } });
    if (!account) {
      result.messages.push('Account Not Found!');
      return result;
    }

    // CHECK EXISTING OTP
    if (!(await this.otpService.checkExistingOTPOfAccount(account, otp))) {
      result.messages.push('Incorrect OTP!');
      return result;
    }

    // CHECK EXPIRING OTP
    if (!(await this.otpService.checkExpiringOTPOfAccount(account, otp))) {
      result.messages.push('The OTP has expired!');
      return result;
    }

    try {
      // GENERATE A NEW TOKEN FOR ACCOUNT AND SAVE INTO DATABASE
      const token = await this.tokenService.setTokenToAccount(account);

      if (token == '') {
        result.messages = ['Server Found Error. Please try later'];
        AppService.error('Login account failed');
        return result;
      }

      // SET THE BACK TOKEN FOR ACCOUNT
      result.result = true;
      result.messages = ['Login successfully'];
      result.data = { account, token };

      return result;
    } catch (error) {
      // HANDLE ERROR
      result.messages = ['Server Found Error. Please try later'];
      AppService.error('Login account failed', error);
      return result;
    }
  }

  /**
   * to login an account
   * @param userName
   * @param aiKey
   * @param otp
   * @param account
   * @returns
   */
  async changeInfo(
    userName: string,
    aiKey: string,
    otp: number,
    account: Account,
  ): Promise<UpdatedResponseObject<Account | null>> {
    // RESPONSE OBJECT
    const result = new UpdatedResponseObject<Account | null>(false);

    // VALIDATE USERNAME
    if (!AccountService.validateUserName(userName)) {
      result.messages.push('Invalid Username');
    }

    // VALIDATE AI KEY
    if (!AccountService.validateAIKey(aiKey)) {
      result.messages.push('Invalid Gemini AI Key');
    }

    if (result.messages.length > 0) {
      return result;
    }

    // CHECK EXISTING OTP
    if (!(await this.otpService.checkExistingOTPOfAccount(account, otp))) {
      result.messages.push('Incorrect OTP!');
      return result;
    }

    // CHECK EXPIRING OTP
    if (!(await this.otpService.checkExpiringOTPOfAccount(account, otp))) {
      result.messages.push('The OTP has expired!');
      return result;
    }

    try {
      // SET NEW DATA INTO DATABASE
      const _result = await this.accountRepo.update(
        { id: account.id },
        {
          name: userName,
          aiKey: aiKey,
        },
      );

      if (!_result.affected) {
        result.messages = ['Server Found Error. Please try later'];
        AppService.error('Login account failed');
        return result;
      }

      // SET THE BACK TOKEN FOR ACCOUNT
      result.result = true;
      result.messages = ['Login successfully'];
      account.name = userName;
      account.aiKey = aiKey;
      result.data = account;

      return result;
    } catch (error) {
      // HANDLE ERROR
      result.messages = ['Server Found Error. Please try later'];
      AppService.error('Login account failed', error);
      return result;
    }
  }

  /**
   * to login an account
   * @param token
   * @returns Account|null
   */
  async loginWithToken(token: string): Promise<Account | null> {
    // VALIDATE TOKEN
    if (!AccountService.validateToken(token)) {
      return null;
    }

    // CHECK EXISTING TOKEN
    const actualToken = await this.tokenService.getToken(token);

    if (!actualToken) return null;

    // AppService.debug('exp', {
    //   exp: await this.tokenService.checkExpiringTokenOfAccount(
    //     actualToken.account,
    //     token,
    //   ),
    // });

    // CHECK EXPIRING TOKEN
    if (
      await this.tokenService.checkExpiringTokenOfAccount(
        actualToken.account,
        token,
      )
    ) {
      return null;
    }

    return actualToken.account;
  }

  /**
   * to login an account
   * @param token
   * @returns Account|null
   */
  async loginAdminWithToken(token: string): Promise<Account | null> {
    // LOGIN AS NORMAL USER
    const account = await this.loginWithToken(token);

    if (!account) return null;

    // CHECK IS ADMIN
    const _configs: typeof configs = require('../datas/configs.json');
    // AppService.debug('configs', _configs);
    // AppService.debug('is admin', { result: account.id === _configs?.admin_id });

    return account.id === _configs?.admin_id ? account : null;
  }

  storeAIAccounts(
    accounts: Account[],
  ): Promise<UpdatedResponseObject<Account[]>> {
    throw new Error();
  }

  async getActiveAIKey(): Promise<string> {
    // GET ALL AI ACCOUNTS
    const assistants = (await this.getAllAIAccounts(1, 10000, '')).data; //41

    let currentHour = new Date().getHours(); //7
    if (currentHour === 0) {
      currentHour = 24;
    }

    let activeIndex = 0;

    if (currentHour > assistants.length) {
      activeIndex = currentHour % assistants.length;
    } else if (currentHour === assistants.length) {
      activeIndex = assistants.length;
    } else {
      const itemQuantity =
        Math.floor(assistants.length / 24) +
        (currentHour <= assistants.length % 24 ? 1 : 0);
      activeIndex = 24 * Math.floor(Math.random() * itemQuantity) + currentHour;
    }

    return assistants[activeIndex].aiKey;
  }

  checkAPIMode(): boolean {
    // GET CONFIGS
    const _configs: typeof configs = require('../datas/configs.json');

    // RETURN STATUS
    return !_configs.maintain_mode;
  }

  setMaintainMode(): boolean {
    // GET CONFIGS
    const _configs: typeof configs = require('../datas/configs.json');

    // SET STATUS
    _configs.maintain_mode = !_configs.maintain_mode;

    // SAVE NEW CONFIGS
    try {
      const filePath = path.join(__dirname, '..', 'datas', 'configs.json');
      const jsonContent = JSON.stringify(_configs, null, 2); // Pretty JSON
      fs.writeFileSync(filePath, jsonContent, 'utf-8');

      return true;
    } catch (error) {
      AppService.error('Cannot save new maintain status', error);
      return false;
    }
  }

  async getDeletedAIAccounts(): Promise<Account[]> {
    // GET DELETED AI ACCOUNTS
    const accounts = await this.accountRepo.find({
      where: { status: AccountStatus.IS_AI_DELETED },
    });

    return accounts;
  }

  /** STATIC METHODS **/
  /**
   * to check a valid email
   *
   * @param email - string: email that needs to be checked
   * @returns boolean
   */
  static validateEmail(email: string): boolean {
    if (!email) return false;

    return EMAIL_REGEX.test(email);
  }

  /* to check a valid userName
   *
   * @param user - string: user name that needs to be checked
   * @returns boolean
   */
  static validateUserName(name: string): boolean {
    if (!name) return false;

    return USERNAME_REGEX.test(name);
  }

  /* to check a valid ai key
   *
   * @param key - string: key that needs to be checked
   * @returns boolean
   */
  static validateAIKey(key: string): boolean {
    if (!key) return false;

    return AI_KEY_REGEX.test(key);
  }

  /* to check a valid token
   *
   * @param token - string: token that needs to be checked
   * @returns boolean
   */
  static validateToken(token: string): boolean {
    if (!token) return false;

    return TOKEN_REGEX.test(token);
  }

  /* to check a valid otp
   *
   * @param token - string: token that needs to be checked
   * @returns boolean
   */
  static validateOTP(otp: number): boolean {
    if (!otp || otp < 100000 || otp > 999999) return false;

    return OTP_REGEX.test(otp + '');
  }
}
