import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { Client } from '../../clients/client.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private entryRepo: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private lineRepo: Repository<JournalEntryLine>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private dataSource: DataSource,
  ) {}

  async seedUruguayAccounts() {
    const count = await this.accountRepo.count();
    if (count > 0) return { message: 'El Plan de Cuentas ya contiene datos.' };

    const seedAccounts = [
      // 1. ACTIVO
      { code: '1', name: 'ACTIVO', type: 'Activo', parentCode: null },
      { code: '1.1', name: 'Activo Corriente', type: 'Activo', parentCode: '1' },
      { code: '1.1.01', name: 'Caja M/N', type: 'Activo', parentCode: '1.1' },
      { code: '1.1.02', name: 'Banco BROU M/N', type: 'Activo', parentCode: '1.1' },
      { code: '1.1.03', name: 'Banco Itaú M/E', type: 'Activo', parentCode: '1.1' },
      { code: '1.1.04', name: 'Deudores por Ventas (Clientes RUT)', type: 'Activo', parentCode: '1.1' },
      { code: '1.1.05', name: 'IVA Crédito Fiscal 22% (DGI)', type: 'Activo', parentCode: '1.1' },
      { code: '1.1.06', name: 'IVA Crédito Fiscal 10% (DGI)', type: 'Activo', parentCode: '1.1' },
      { code: '1.2', name: 'Activo No Corriente', type: 'Activo', parentCode: '1' },
      { code: '1.2.01', name: 'Bienes de Uso y Maquinaria Agro', type: 'Activo', parentCode: '1.2' },

      // 2. PASIVO
      { code: '2', name: 'PASIVO', type: 'Pasivo', parentCode: null },
      { code: '2.1', name: 'Pasivo Corriente', type: 'Pasivo', parentCode: '2' },
      { code: '2.1.01', name: 'Acreedores por Compras (Proveedores RUT)', type: 'Pasivo', parentCode: '2.1' },
      { code: '2.1.02', name: 'IVA Débito Fiscal 22% (DGI)', type: 'Pasivo', parentCode: '2.1' },
      { code: '2.1.03', name: 'IVA Débito Fiscal 10% (DGI)', type: 'Pasivo', parentCode: '2.1' },
      { code: '2.1.04', name: 'Obligaciones DGI / BPS a Pagar', type: 'Pasivo', parentCode: '2.1' },

      // 3. PATRIMONIO
      { code: '3', name: 'PATRIMONIO NETO', type: 'Patrimonio', parentCode: null },
      { code: '3.1', name: 'Capital Social', type: 'Patrimonio', parentCode: '3' },
      { code: '3.2', name: 'Resultados Acumulados', type: 'Patrimonio', parentCode: '3' },

      // 4. INGRESOS
      { code: '4', name: 'INGRESOS OPERATIVOS', type: 'Ingreso', parentCode: null },
      { code: '4.1.01', name: 'Ventas de Servicios / Bienes Tasa 22%', type: 'Ingreso', parentCode: '4' },
      { code: '4.1.02', name: 'Ventas de Granos y Cereales (Agro Exento DGI)', type: 'Ingreso', parentCode: '4' },
      { code: '4.2.01', name: 'Exportaciones de Granos', type: 'Ingreso', parentCode: '4' },

      // 5. EGRESOS / GASTOS
      { code: '5', name: 'EGRESOS Y GASTOS', type: 'Egreso', parentCode: null },
      { code: '5.1.01', name: 'Costo de Ventas y Mercadería', type: 'Egreso', parentCode: '5' },
      { code: '5.2.01', name: 'Gastos de Administración y Servicios', type: 'Egreso', parentCode: '5' },
      { code: '5.3.01', name: 'Sueldos y Cargas Sociales BPS', type: 'Egreso', parentCode: '5' },
    ];

    for (const acc of seedAccounts) {
      const entity = this.accountRepo.create({
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        parentCode: acc.parentCode,
        balance: 0,
        isActive: true,
      });
      await this.accountRepo.save(entity);
    }

    return { message: 'Plan de Cuentas oficial de Uruguay inicializado con éxito.' };
  }

  async getAllAccounts() {
    return this.accountRepo.find({ order: { code: 'ASC' } });
  }

  async createAccount(data: any) {
    const existing = await this.accountRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`El código de cuenta ${data.code} ya existe.`);

    const account = this.accountRepo.create({
      code: data.code,
      name: data.name,
      type: data.type,
      parentCode: data.parentCode || null,
      balance: 0,
      customFields: data.customFields || {},
    });
    return this.accountRepo.save(account);
  }

  async getAllEntries() {
    return this.entryRepo.find({
      order: { date: 'DESC', createdAt: 'DESC' },
      relations: ['lines', 'lines.account', 'lines.client'],
    });
  }

  async createEntry(dto: {
    date: string;
    concept: string;
    documentReference?: string;
    customFields?: Record<string, any>;
    lines: {
      accountId: number;
      clientId?: number;
      description?: string;
      debit: number;
      credit: number;
    }[];
  }) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Un asiento contable requiere al menos 2 líneas (partida doble).');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of dto.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Desbalance en partida doble: Total Debe ($${totalDebit.toFixed(2)}) != Total Haber ($${totalCredit.toFixed(2)}).`
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const count = await manager.count(JournalEntry);
      const entryNumber = `ASI-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      const entry = manager.create(JournalEntry, {
        entryNumber,
        date: dto.date || new Date().toISOString().split('T')[0],
        concept: dto.concept,
        documentReference: dto.documentReference || '',
        status: 'Posted',
        totalAmount: totalDebit,
        customFields: dto.customFields || {},
      });

      const savedEntry = await manager.save(JournalEntry, entry);

      for (const l of dto.lines) {
        const account = await manager.findOne(Account, { where: { id: l.accountId } });
        if (!account) throw new NotFoundException(`Cuenta ID ${l.accountId} no encontrada.`);

        let client: Client | undefined = undefined;
        if (l.clientId) {
          const found = await manager.findOne(Client, { where: { id: l.clientId } });
          if (found) client = found;
        }

        const lineEntity = manager.create(JournalEntryLine, {
          entry: savedEntry,
          account,
          client,
          description: l.description || dto.concept,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        });
        await manager.save(JournalEntryLine, lineEntity);

        // Actualizar saldo de la cuenta contable
        const d = Number(l.debit || 0);
        const c = Number(l.credit || 0);
        if (['Activo', 'Egreso'].includes(account.type)) {
          account.balance = Number(account.balance) + d - c;
        } else {
          account.balance = Number(account.balance) + c - d;
        }
        await manager.save(Account, account);
      }

      return manager.findOne(JournalEntry, {
        where: { id: savedEntry.id },
        relations: ['lines', 'lines.account', 'lines.client'],
      });
    });
  }

  async deleteEntry(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const entry = await manager.findOne(JournalEntry, {
        where: { id },
        relations: ['lines', 'lines.account'],
      });

      if (!entry) throw new NotFoundException('Asiento no encontrado.');

      // Revertir saldos de cuentas
      for (const l of entry.lines) {
        const account = l.account;
        if (account) {
          const d = Number(l.debit || 0);
          const c = Number(l.credit || 0);
          if (['Activo', 'Egreso'].includes(account.type)) {
            account.balance = Number(account.balance) - d + c;
          } else {
            account.balance = Number(account.balance) - c + d;
          }
          await manager.save(Account, account);
        }
      }

      await manager.remove(JournalEntry, entry);
      return { success: true };
    });
  }

  async getTrialBalance() {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });

    // Agregación SQL directa para evitar traer todas las líneas a memoria
    const totals: { accountId: number; totalDebit: string; totalCredit: string }[] =
      await this.lineRepo
        .createQueryBuilder('line')
        .select('line.accountId', 'accountId')
        .addSelect('SUM(line.debit)', 'totalDebit')
        .addSelect('SUM(line.credit)', 'totalCredit')
        .groupBy('line.accountId')
        .getRawMany();

    const totalsMap = new Map<number, { debit: number; credit: number }>();
    for (const t of totals) {
      totalsMap.set(Number(t.accountId), {
        debit: Number(t.totalDebit || 0),
        credit: Number(t.totalCredit || 0),
      });
    }

    return accounts.map((acc) => {
      const t = totalsMap.get(acc.id) || { debit: 0, credit: 0 };
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        totalDebit: t.debit,
        totalCredit: t.credit,
        balance: acc.balance,
      };
    });
  }

  async getProfitAndLoss() {
    const accounts = await this.accountRepo.find();
    const incomeAccounts = accounts.filter((a) => a.type === 'Ingreso');
    const expenseAccounts = accounts.filter((a) => a.type === 'Egreso');

    const totalIncome = incomeAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const netResult = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netResult,
      incomeAccounts,
      expenseAccounts,
    };
  }
}
