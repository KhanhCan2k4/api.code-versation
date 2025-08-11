import {
  Body,
  Controller,
  Get,
  Headers,
  Injectable,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Marketing } from 'src/models/Marketing';
import PaginatedObject from 'src/models/PaginatedObject';
import { AccountService } from 'src/services/AccountService';
import { MarketingService } from 'src/services/MarketingService';
import * as FB from 'fb';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Account } from 'src/models/Account';

@Controller('/api/marketings')
@Injectable()
export class MarketingController {
  /** PROPERTIES **/

  /** CONSTRUCTOR **/
  constructor(
    protected readonly marketingService: MarketingService,
    protected readonly accountService: AccountService,
    private readonly mailService: MailerService,
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

  @Post('/fb')
  async createFBPost(
    @Res() res,
    @Body() body: { id: number },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // CHECK MARKETING
    const marketing = await this.marketingService.getMarketingById(body.id);

    if (!marketing) {
      AppService.error('Marketing Not Found');
      return res.status(500).json(false);
    }

    // UPDATE TIMES TO SPEAD
    marketing.count += 1;
    await this.marketingService.store(marketing);

    // CALL SERVICE TO POST
    MarketingController.createFacebookPost(marketing, (link) => {
      return res.status(200).json(link);
    });
  }

  @Post('/gmail')
  async createMailPost(
    @Res() res,
    @Body() body: { id: number },
    @Headers() header: { token: string },
  ) {
    // CHECK ADMIN ACCOUNT
    const admin = await this.accountService.loginAdminWithToken(header.token);

    if (!admin) {
      AppService.error('Admin Not Found');
      return res.status(403).json(false);
    }

    // CHECK MARKETING
    const marketing = await this.marketingService.getMarketingById(body.id);

    if (!marketing) {
      AppService.error('Marketing Not Found');
      return res.status(500).json(false);
    }

    // UPDATE TIMES TO SPEAD
    marketing.count += 1;
    await this.marketingService.store(marketing);

    // GET ALL ACTIVE ACCOUNTS
    const accounts = await this.accountService.getAllBasicAccounts();

    // SEND EMAIL
    let count = 0;
    for (const account of accounts) {
      if (await this.createGmailPost(marketing, account)) {
        count += 1;
      }
    }
    return res.status(200).json(count);
  }

  /**
   * to create a FB post and return a link
   * @param marketing
   * @param onSent
   */
  async createGmailPost(marketing: Marketing, account: Account) {
    //prepare data
    const APP_NAME = 'CODE-VERSATIONS';

    const html = MarketingController.markdownToGmailHtml(marketing.content);

    const sendMailOptions: ISendMailOptions = {
      to: account.email,
      subject: 'Hi There. ' + APP_NAME + ' here !?!',
      html,
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

  /** STATIC METHODS **/
  /**
   * Convert Markdown to Facebook-friendly plain text
   */

  static markdownToFacebookText(markdown: string): string {
    let text = markdown;

    // Remove headings (#, ##, ###, etc.)
    text = text.replace(/^#{1,6}\s*/gm, '');

    // Bold (**text** or __text__) → plain text
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');

    // Italic (*text* or _text_) → plain text
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    // Inline code `code` → keep code but remove backticks
    text = text.replace(/`([^`]+)`/g, '$1');

    // Code block ```code``` → keep content
    text = text.replace(/```([\s\S]*?)```/g, '$1');

    // Links [text](url) → "text (url)"
    text = text.replace(
      /$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$(https?:\/\/[^$end:math:text$]+)\)/g,
      '$1 ($2)',
    );

    // Images ![alt](url) → "alt (url)"
    text = text.replace(
      /!$begin:math:display$([^$end:math:display$]*)\]$begin:math:text$(https?:\/\/[^$end:math:text$]+)\)/g,
      '$1 ($2)',
    );

    // Unordered list items (- or *) → keep as "• "
    text = text.replace(/^\s*[-*]\s+/gm, '• ');

    // Ordered list items (1. 2. etc.) → keep numbers
    text = text.replace(/^\s*\d+\.\s+/gm, (match) => match.trim() + ' ');

    // Remove extra multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim spaces
    text = text.trim();

    return text;
  }

  /**
   * to create a FB post and return a link
   * @param marketing
   * @param onSent
   */
  static createFacebookPost(
    marketing: Marketing,
    onSent: (link: string) => void,
  ) {
    FB.options({
      accessToken:
        'EAAPvAsF3q0YBPDAyZBryIAcZCjVh2MDJZBQ0nrki7G3uHdiyZAJRHKnQvB3ZBJvelA7iJFrtovbmwaJZCimAeQBu4jSDI5ZBIsMzKgI6NwDBZAZCgxoGYUpR3KknA6TuYYWu9upCgCSvJ3ZAFaBQPHdbsJCrISusup4ZC6S0S6tsjtR3OXZBg8vGnR8mSb8LnhJ3815GZBEz3evQc',
    });

    const message = MarketingController.markdownToFacebookText(
      marketing.content,
    );

    FB.api(
      `${'728175530380226'}/feed`,
      'post',
      {
        message,
      },
      (result) => {
        if (!result || result.error) {
          AppService.error('Cannot create new FB post', result.error);
          onSent('');
        }

        onSent(`https://www.facebook.com/${result.id}`);
      },
    );
  }

  /**
   * to change markdown into html
   * @param markdown
   * @returns
   */
  static markdownToGmailHtml(markdown: string): string {
    let html = markdown;

    // Escape HTML special chars to prevent unintended tags
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings (#, ##, ###)
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/__(.*?)__/g, '<b>$1</b>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.*?)_/g, '<i>$1</i>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');

    // Links
    html = html.replace(
      /$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$(https?:\/\/[^$end:math:text$]+)\)/g,
      '<a href="$2">$1</a>',
    );

    // Images
    html = html.replace(
      /!$begin:math:display$([^$end:math:display$]*)\]$begin:math:text$(https?:\/\/[^$end:math:text$]+)\)/g,
      '<img alt="$1" src="$2" style="max-width:100%;">',
    );

    // Unordered list
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Ordered list
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

    // Blockquotes
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');

    // Paragraphs (anything not wrapped yet)
    html = html.replace(
      /^(?!<h\d|<ul>|<ol>|<li>|<blockquote>|<pre>|<img|<p|<\/)(.+)$/gm,
      '<p>$1</p>',
    );

    return html;
  }
}
