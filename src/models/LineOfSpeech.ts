import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Topic } from './Topic';
import { Account } from './Account';
import { Conversation } from './Conversation';

@Entity('line_of_speechs')
export class LineOfSpeech {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'mediumtext' })
  content: string;

  @Column({ type: 'mediumtext', name: 'vn_meaning' })
  vnMeaning: string;

  @Column({ type: 'longtext', name: 'short_explanation', nullable: true })
  shortExplanation: string;

  //   REALTIONS
  @Column()
  speaker_id: number;

  @ManyToOne(() => Account, (account) => account.lines, {
    onDelete: 'CASCADE',
  })
  speaker: Account;

  @Column()
  conversation_id: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.lines, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;
}
