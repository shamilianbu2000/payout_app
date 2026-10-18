import {
  BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from './roles.guard';
import { StoreService } from './store.service';
import { PayoutTemplate } from './types';

@Controller()
@UseGuards(AdminGuard)
export class AppController {
  constructor(private readonly store: StoreService) {}

  @Get('health') health() { return { status: 'ok' }; }

  @Get('doctors') doctors() { return this.store.listDoctors(); }
  @Patch('doctors/:id/template')
  assign(@Param('id') id: string, @Body('templateId') templateId: string) {
    return this.store.assignTemplate(id, templateId);
  }

  @Get('templates') templates() { return this.store.listTemplates(); }
  @Post('templates') create(@Body() b: Partial<PayoutTemplate>) { return this.store.createTemplate(b); }
  @Put('templates/:id') update(@Param('id') id: string, @Body() b: Partial<PayoutTemplate>) {
    return this.store.updateTemplate(id, b);
  }

  @Post('collections/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  upload(@UploadedFile() file?: { originalname: string; buffer: Buffer }) {
    if (!file) throw new BadRequestException('Attach a CSV as multipart field "file"');
    return this.store.ingestCsv(file.originalname, file.buffer.toString('utf8'));
  }
  @Get('collections') collections(@Query('month') month?: string) { return this.store.listCollections(month); }
  @Get('uploads') uploads() { return this.store.listUploads(); }

  @Post('payouts/calculate') calculate(@Body('month') month: string) { return this.store.calculate(month); }
  @Get('payouts') payouts(@Query('month') month: string) { return this.store.getPayouts(month); }
}
