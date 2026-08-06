import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { Visit } from '../visits/visit.entity';

@Entity('inspections')
export class Inspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 5 })
  desksCleaned: number; // Rating 1-5

  @Column({ default: 5 })
  floorsSwept: number; // Rating 1-5

  @Column({ default: true })
  binsEmptied: boolean;

  @Column({ default: true })
  bathroomsSanitized: boolean;

  @Column({ default: true })
  glassCleaned: boolean;

  @Column({ type: 'integer', default: 100 })
  generalScore: number; // 0 to 100

  @Column('text', { nullable: true })
  notes: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => Visit, { onDelete: 'SET NULL', nullable: true, eager: true })
  visit: Visit;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
