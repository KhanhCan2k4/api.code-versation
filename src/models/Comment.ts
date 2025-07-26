import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './Conversation';
import { Account } from './Account';
import { Question } from './Question';
import { LineOfSpeech } from './LineOfSpeech';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column()
  account_id: number;

  @Column({ default: -1 })
  conversation_id: number;

  @Column({ default: -1 })
  line_id: number;

  @Column({ default: -1 })
  question_id: number;

  // RELATIONS
  @OneToMany(() => Conversation, (con) => con.comments, {
    onDelete: 'CASCADE',
  })
  conversation?: Conversation;

  @OneToMany(() => LineOfSpeech, (line) => line.comments, {
    onDelete: 'CASCADE',
  })
  line?: LineOfSpeech;

  @OneToMany(() => Question, (question) => question.comments, {
    onDelete: 'CASCADE',
  })
  question?: Question;

  @OneToMany(() => Account, (account) => account.comments)
  account: Account;
}
