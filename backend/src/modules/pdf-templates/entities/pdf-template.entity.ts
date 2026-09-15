import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PdfTemplateLayoutConfig } from '../interfaces/pdf-template.interface';

@Entity('pdf_templates')
export class PdfTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g. "Estándar Granos (Perfilgranos)"

  @Column({ unique: true })
  code: string; // e.g. "GRAINS_STANDARD"

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'grains' })
  category: string; // 'grains' | 'corporate' | 'inputs' | 'minimal'

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  layoutConfig: PdfTemplateLayoutConfig;

  @Column({ type: 'text', nullable: true })
  headerNotes: string;

  @Column({ type: 'text', nullable: true })
  footerNotes: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
