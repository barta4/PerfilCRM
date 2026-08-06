import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ModulesGuard } from '../../auth/modules.guard';
import { RequireModule } from '../../auth/require-module.decorator';

@Controller('accounting')
@RequireModule('accounting_uruguay')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Post('seed')
  seed() {
    return this.service.seedUruguayAccounts();
  }

  @Get('accounts')
  getAccounts() {
    return this.service.getAllAccounts();
  }

  @Post('accounts')
  createAccount(@Body() body: any) {
    return this.service.createAccount(body);
  }

  @Get('entries')
  getEntries() {
    return this.service.getAllEntries();
  }

  @Post('entries')
  createEntry(@Body() body: any) {
    return this.service.createEntry(body);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.service.deleteEntry(+id);
  }

  @Get('trial-balance')
  getTrialBalance() {
    return this.service.getTrialBalance();
  }

  @Get('profit-loss')
  getProfitAndLoss() {
    return this.service.getProfitAndLoss();
  }
}
