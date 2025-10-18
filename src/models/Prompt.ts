import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('prompts')
export class Prompt {
  @PrimaryColumn()
  id: number;

  @Column()
  title: string;

  @Column({ name: 'short_desc', type: 'mediumtext' })
  shortDesc: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: 0 })
  count: number;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
