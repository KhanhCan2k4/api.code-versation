import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MarketingStatus, Status } from 'src/datas/enums/status';

@Entity('marketings')
export class Marketing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'longtext' })
  content;

  @Column({
    type: 'tinyint',
    nullable: false,
    default: MarketingStatus.FOR_GMAIL,
  })
  status: Status | MarketingStatus;

  @Column({ default: 0 })
  count: number;

  @Column({
    name: 'activated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  activatedAt: Date;

  @Column({
    default: 1,
  })
  loop: number;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
