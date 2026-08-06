import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Client } from '../../../clients/client.entity';

@Entity('accounting_journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' })
  entry: JournalEntry;

  @ManyToOne(() => Account, { eager: true, onDelete: 'RESTRICT' })
  account: Account;

  @ManyToOne(() => Client, { nullable: true, eager: true, onDelete: 'SET NULL' })
  client?: Client; // Tercero vinculado (Cliente o Proveedor con RUT)

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  credit: number;
}
