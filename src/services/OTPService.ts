import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { Account } from 'src/models/Account';
import { OTP } from 'src/models/OTP';
import { Repository } from 'typeorm';

export const EXPIRED_TIME_LENGTH = 10 * 60 * 60 * 1000;

@Injectable()
export class OTPService {
  /** CONSTRUCTOR **/
  constructor(
    @InjectRepository(OTP)
    protected readonly otpRepo: Repository<OTP>,
  ) {}

  /** METHODS **/
  /**
   * to check a otp that is existing or not
   * @param account
   * @param otp
   * @returns boolean
   */
  async checkExistingOTPOfAccount(
    account: Account,
    otp: number,
  ): Promise<boolean> {
    // CHECK INPUT PARAMS
    if (!account || !account.id || !otp || otp < 100000 || otp > 999999)
      return false;

    // FIND FROM DATABASE
    const _otp = await this.otpRepo.findOne({
      where: { accountId: account.id, otp: otp },
    });

    if (!_otp) {
      return false;
    }

    return true;
  }

  /**
   * to check a otp that is expired or not
   * @param account
   * @param otp
   * @returns boolean
   */
  async checkExpiringOTPOfAccount(
    account: Account,
    otp: number,
  ): Promise<boolean> {
    // CHECK INPUT PARAMS
    if (!account || !account.id || !otp || otp < 100000 || otp > 999999)
      return false;

    // FIND FROM DATABASE
    const _otp = await this.otpRepo.findOne({
      where: { accountId: account.id, otp: otp },
    });

    if (!_otp) {
      return false;
    }

    if (_otp.createdAt.getTime() < new Date().getTime() - EXPIRED_TIME_LENGTH) {
      return false;
    }

    return true;
  }

  /**
   *
   */
  async setOTPForAccount(account: Account): Promise<OTP> {
    const otp = OTPService.generateOTP();

    // CREATE AND STORE OTP INTO DATABASE
    let _otp = this.otpRepo.create({
      account: account,
      accountId: account.id,
      otp: otp,
      createdAt: new Date(),
    });

    try {
      _otp = await this.otpRepo.save(_otp);

      return _otp;
    } catch (error) {
      AppService.error('Cannot set OTP for account', error);
      throw new Error('Cannot set OTP for account', error);
    }
  }

  /** STATIC METHODS **/
  /**
   * to generate a new otp for an account
   * @param username
   * @param email
   * @returns
   */
  static generateOTP(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }
}
