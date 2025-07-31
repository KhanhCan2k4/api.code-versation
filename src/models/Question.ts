import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum QuestionType {
  AUDIO_TEXT = 1,
  TEXT_AUDIO = 2,
  TEXT_TEXT = 3,
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'tinyint' })
  type: number;

  @Column({ type: 'mediumtext' })
  question: string;

  @Column({ type: 'tinyint' })
  answer: QuestionType;

  @Column({ type: 'json' })
  options: string[];

  @Column({ name: 'short_desc', type: 'mediumtext', nullable: true })
  shortExplanation: string;

  //   REALTIONS
  @Column({ name: 'conversation_id' })
  conversationId: number;
}
