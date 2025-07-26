import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Practice } from './Practice';
import { Comment } from './Comment';

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

  @Column({ name: 'option_a' })
  optionA: string;

  @Column({ name: 'option_b' })
  optionB: string;

  @Column({ name: 'option_c', nullable: true })
  optionC: string;

  @Column({ name: 'option_d', nullable: true })
  optionD: string;

  @Column({ name: 'short_desc', type: 'mediumtext', nullable: true })
  shortExplanation: string;

  //   REALTIONS
  @Column()
  practice_id: number;

  @ManyToOne(() => Practice, (practice) => practice.questions, {
    onDelete: 'CASCADE',
  })
  practice: Practice;

  @OneToMany(() => Comment, (comment) => comment.question, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  comments: Comment[];
}
