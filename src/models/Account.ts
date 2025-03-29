import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('characters') // Table name
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', comment: 'in Vietnamese' })
  short_desc: string;

  @Column({ type: 'int', nullable: true })
  account_id: number | null;

  @Column({ type: 'varchar', length: 255 })
  image_path: string;

  @Column({ type: 'enum', enum: ['HERO', 'VILLAIN', 'NPC'], default: 'NPC' })
  type: 'HERO' | 'VILLAIN' | 'NPC'; // Enum for character_types

  @Column({ type: 'int' })
  voice_id: number;

  @Column({ type: 'bigint' })
  created_at: number;

  @Column({ type: 'bigint' })
  updated_at: number;
}
