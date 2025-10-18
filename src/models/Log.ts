import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum LogType {
  INFO,
  DEBUG,
  SUCCESS,
  WARN,
  ERROR,
}

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: LogType.INFO })
  type: LogType;

  @Column({ type: 'mediumtext' })
  message: string;

  @Column({ type: 'longtext' })
  data: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
