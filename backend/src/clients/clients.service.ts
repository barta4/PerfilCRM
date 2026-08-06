import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Client } from './client.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private repository: Repository<Client>,
  ) {}

  async findAll(status?: string, type?: string): Promise<Client[]> {
    const whereClause: any = {};

    if (status) {
      whereClause.status = In(status.split(','));
    }

    if (type === 'supplier') {
      whereClause.isSupplier = true;
    } else if (type === 'client') {
      whereClause.isClient = true;
    } else if (type === 'both') {
      whereClause.isClient = true;
      whereClause.isSupplier = true;
    } else if (type === 'all') {
      // Return all without role filter
    } else {
      // Default behavior for clients list
      whereClause.isClient = true;
    }

    return this.repository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Client | null> {
    return this.repository.findOneBy({ id: Number(id) });
  }

  async create(data: Partial<Client>): Promise<Client> {
    const payload: Partial<Client> = { ...data };
    if (!payload.code) {
      payload.code = `TER-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`;
    }
    if ((data as any).name && !payload.businessName) {
      payload.businessName = (data as any).name;
    }
    if ((data as any).email && !payload.companyEmail) {
      payload.companyEmail = (data as any).email;
    }
    if ((data as any).rut && !payload.taxId) {
      payload.taxId = (data as any).rut;
    }
    // Ensure default flags if missing
    if (payload.isClient === undefined && payload.isSupplier === undefined) {
      payload.isClient = true;
      payload.isSupplier = false;
    }
    const entity = this.repository.create(payload);
    return this.repository.save(entity);
  }

  async update(id: number, data: Partial<Client>): Promise<Client | null> {
    await this.repository.save({ ...data, id: Number(id) } as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(Number(id));
  }

  async exportToExcel(): Promise<Buffer> {
    const clients = await this.findAll(undefined, 'all');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Terceros');

    worksheet.columns = [
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Razón Social', key: 'businessName', width: 30 },
      { header: 'RUT (Uruguay)', key: 'taxId', width: 18 },
      { header: 'Es Cliente', key: 'isClient', width: 12 },
      { header: 'Es Proveedor', key: 'isSupplier', width: 12 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Email Empresa', key: 'companyEmail', width: 28 },
      { header: 'Industria', key: 'industry', width: 20 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Dirección', key: 'address', width: 35 },
    ];

    clients.forEach((c) => {
      worksheet.addRow({
        code: c.code || '',
        businessName: c.businessName || '',
        taxId: c.taxId || '',
        isClient: c.isClient ? 'Sí' : 'No',
        isSupplier: c.isSupplier ? 'Sí' : 'No',
        phone: c.phone || '',
        companyEmail: c.companyEmail || '',
        industry: c.industry || '',
        status: c.status || 'Activo',
        address: c.address || '',
      });
    });

    return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
  }

  async importFromExcel(buffer: Buffer): Promise<{ created: number; updated: number }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('El archivo Excel está vacío o no es válido');
    }

    let created = 0;
    let updated = 0;

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values as any[];
      if (!values || !values[2]) return;

      rows.push({
        code: values[1] ? String(values[1]).trim() : `TER-${Date.now().toString().slice(-4)}${rowNumber}`,
        businessName: String(values[2]).trim(),
        taxId: values[3] ? String(values[3]).trim() : undefined,
        isClient: values[4] ? String(values[4]).toLowerCase().includes('sí') || String(values[4]).toLowerCase().includes('si') : true,
        isSupplier: values[5] ? String(values[5]).toLowerCase().includes('sí') || String(values[5]).toLowerCase().includes('si') : false,
        phone: values[6] ? String(values[6]).trim() : undefined,
        companyEmail: values[7] ? String(values[7]).trim() : undefined,
        industry: values[8] ? String(values[8]).trim() : undefined,
        status: values[9] ? String(values[9]).trim() : 'Activo',
        address: values[10] ? String(values[10]).trim() : undefined,
      });
    });

    for (const clientData of rows) {
      let existing: Client | null = null;
      if (clientData.code) {
        existing = await this.repository.findOneBy({ code: clientData.code });
      }
      if (!existing && clientData.taxId) {
        existing = await this.repository.findOneBy({ taxId: clientData.taxId });
      }

      if (existing) {
        await this.repository.update(existing.id, clientData);
        updated++;
      } else {
        const newClient = this.repository.create(clientData);
        await this.repository.save(newClient);
        created++;
      }
    }

    return { created, updated };
  }
}
