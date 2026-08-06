import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Client } from '../clients/client.entity';
import { Contact } from '../contacts/contact.entity';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.logs, {
    onDelete: 'CASCADE',
    eager: false,
  })
  campaign: Campaign;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => Contact, { onDelete: 'CASCADE', eager: true })
  contact: Contact;

  @Column()
  recipientEmail: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'timestamp', nullable: true })
  openedAt: Date;

  @Column({ default: 0 })
  openCount: number;

  @Column({ type: 'timestamp', nullable: true })
  clickedAt: Date;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
