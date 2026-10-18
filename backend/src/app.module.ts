import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StoreService } from './store.service';

@Module({ controllers: [AppController], providers: [StoreService] })
export class AppModule {}
