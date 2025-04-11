import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { UsersService } from './user.service';
import { PostsService } from './post.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [PrismaService, UsersService, PostsService],
})
export class AppModule {}
