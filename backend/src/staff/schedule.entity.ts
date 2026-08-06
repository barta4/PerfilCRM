import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Cleaner } from './cleaner.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => Cleaner, { onDelete: 'CASCADE', eager: true })
  cleaner: Cleaner;

  @Column({ type: 'integer' })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Column()
  startTime: string; // e.g. "08:00"

  @Column()
  endTime: string; // e.g. "12:00"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
