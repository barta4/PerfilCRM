import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  role: string; // e.g. Manager, Buyer

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  personalPhone: string;

  @Column({ nullable: true })
  gender: string; // e.g. Male, Female, Other, Prefer not to say

  @Column('text', { nullable: true })
  hobbies: string;

  @Column({ nullable: true })
  preferredChannel: string; // e.g. WhatsApp, Email, Call

  @Column('jsonb', { nullable: true })
  socialInsights: any; // AI generated insights

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
