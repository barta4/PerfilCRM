import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('inventory')
@RequireModule('inventory')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('items')
  findAllItems() {
    return this.service.findAllItems();
  }

  @Post('items')
  createItem(@Body() data: any) {
    return this.service.createItem(data);
  }

  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() data: any) {
    return this.service.updateItem(+id, data);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.service.deleteItem(+id);
  }

  @Get('client-stocks')
  findAllClientStocks(@Query('clientId') clientId?: string) {
    if (clientId) {
      return this.service.findByClient(+clientId);
    }
    return this.service.findAllClientStocks();
  }

  @Post('client-stocks/transfer')
  transferToClient(
    @Body('clientId') clientId: number,
    @Body('itemId') itemId: number,
    @Body('quantity') quantity: number,
    @Body('minThreshold') minThreshold?: number,
  ) {
    return this.service.transferToClient(
      clientId,
      itemId,
      quantity,
      minThreshold,
    );
  }

  @Put('client-stocks/:id')
  updateClientStockQuantity(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.service.updateClientStockQuantity(+id, quantity);
  }

  @Delete('client-stocks/:id')
  deleteClientStock(@Param('id') id: string) {
    return this.service.deleteClientStock(+id);
  }
}
