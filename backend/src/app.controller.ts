import {
  BadRequestException, Body, Controller, Get, Headers, NotFoundException, Param, Patch, Post, Put, Query,
  Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from './roles.guard';
import { StoreService } from './store.service';
import { buildPayoutsXlsx, buildStatementPdf } from './reports';
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
  @Get('templates/changelog') templateChanges() { return this.store.listTemplateChanges(); }
  @Post('templates') create(@Body() b: Partial<PayoutTemplate>, @Headers('x-role') role?: string) {
    return this.store.createTemplate(b, role);
  }
  @Put('templates/:id') update(@Param('id') id: string, @Body() b: Partial<PayoutTemplate>, @Headers('x-role') role?: string) {
    return this.store.updateTemplate(id, b, role);
  }

  @Post('collections/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  upload(@UploadedFile() file?: { originalname: string; buffer: Buffer }) {
    if (!file) throw new BadRequestException('Attach a CSV as multipart field "file"');
    return this.store.ingestCsv(file.originalname, file.buffer.toString('utf8'));
  }
  @Get('collections') collections(@Query('month') month?: string) { return this.store.listCollections(month); }
  @Get('uploads') uploads() { return this.store.listUploads(); }

  @Post('payouts/calculate') calculate(@Body('month') month: string, @Headers('x-role') role?: string) {
    return this.store.calculate(month, role);
  }
  @Get('payouts') payouts(@Query('month') month: string) { return this.store.getPayouts(month); }
  @Get('payouts/history') history(@Query('month') month?: string) { return this.store.listRuns(month); }
  @Get('payouts/history/:id') run(@Param('id') id: string) { return this.store.getRun(id); }
  @Get('payouts/comparison') comparison() { return this.store.comparison(); }

  @Get('payouts/export')
  async exportXlsx(@Res() res: Response, @Query('month') month?: string, @Query('runId') runId?: string) {
    const run = this.store.resolveRun(month, runId);
    const buf = await buildPayoutsXlsx(run);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="payouts-${run.month}-v${run.version}.xlsx"`,
    }).send(buf);
  }

  @Get('payouts/statement')
  async statement(@Res() res: Response, @Query('doctorId') doctorId?: string, @Query('month') month?: string, @Query('runId') runId?: string) {
    const run = this.store.resolveRun(month, runId);
    const r = run.results.find((x) => x.doctorId === doctorId);
    if (!r) throw new NotFoundException(`No payout for doctor ${doctorId} in ${run.month}`);
    const cols = this.store.listCollections(run.month).filter((c) => c.doctorId === r.doctorId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const buf = await buildStatementPdf(r, run, cols);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="statement-${r.doctorId}-${run.month}.pdf"`,
    }).send(buf);
  }
}
