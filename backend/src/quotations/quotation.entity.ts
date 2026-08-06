import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { QuotationItem } from './quotation-item.entity';
import { Client } from '../clients/client.entity';
import { User } from '../auth/user.entity';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  quotationNumber: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => User, { nullable: true, eager: true })
  createdBy: User;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  paymentTerms: string; // e.g. "Contado", "30 días", "60 días"

  @Column('text', { nullable: true })
  notes: string;

  @OneToMany(() => QuotationItem, (item) => item.quotation, {
    cascade: true,
    eager: true,
  })
  items: QuotationItem[];

  @Column({ default: 'Draft' })
  status: string; // Draft, Sent, Approved, Rejected

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customFields: Record<string, any>;
}
