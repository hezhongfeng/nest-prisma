# prisma-examples

一个 TS 环境的ORM，官方推荐使用 postgres 数据库

## 安装 prisma

给一个 nestjs 项目添加 prisma

```bash
npm install prisma --save-dev
```

接着运行 prisma 初始化

```bash
npx prisma init
```

这会生成两个文件

- `prisma/schema.prisma` // 数据库模型
- `.env` // 数据库连接信息，这个文件会被 git 忽略，属于本地的文件，不上传到 git 仓库，各个不同的环境下的数据库连接信息需要自己配置

.env 文件

```bash
DATABASE_URL="postgresql://hezf:@localhost:5432/prisma-pro?schema=public"
```

prisma/schema.prisma 文件

```bash
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## prisma model

接下来定义数据库模型

```bash
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

现在定义完了数据库模型，我们可以使用 prisma 命令来生成数据库模型

```bash
npx prisma migrate dev --name init
```

这时候会生成一个迁移的 sql 文件

```bash
prisma
├── migrations
│   └── 20250411005120_init
│       └── migration.sql
└── schema.prisma
```

检查数据库，会发现已经生成了对应的表

## prisma-client

接下来我们通过 prisma-client 来操作数据库

```bash
npm install @prisma/client
```

继续创建一个文件 `src/prisma.service.ts`

```bash

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

然后在 `src/app.module.ts` 中引入 `PrismaService`；接下来创建一个 `src/user.service.ts` 文件

```typescript

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}

```

接着创建 `post.service.ts` 文件

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}

```

把 `src/user.service.ts` 和 `src/post.service.ts` 引入到 `src/app.module.ts` 中后，继续 `app.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { PostsService } from './post.service';
import { User as UserModel, Post as PostModel } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UsersService,
    private readonly postService: PostsService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}

```

以上就完成了一个简单的 nestjs 项目，这里创建了两个服务 `user.service.ts` 和 `post.service.ts`，可以在 controller 层调用的更舒心一些，和 nestjs 的范式一致。

## 迁移和发版

上面我们在运行 `npx prisma migrate dev --name init`的时候，会生成一个迁移的 sql 文件，这个文件是用来记录数据库的迁移历史的，我们可以通过这个文件来回滚数据库。

在日常开发中，我们可能会修改数据库模型，比如给 user 添加一个电话号码的字段：

```typescript
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  tel   String?
  posts Post[]
}
```

修改完之后，本地运行这个项目，这个时候我们发现，只修改这里没有用，数据库的结构没有变化。需要重新生成迁移文件，然后运行迁移文件，这个时候我们可以使用以下命令：

```bash
npx prisma migrate dev --name add-tel
```

运行之后我们会发现，数据库的结构已经变化了，并且生成了一个新的迁移文件 `prisma/migrations/20250411021730_add_tel`，里面的内容是:

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tel" TEXT;
```

此时再来看看引入的 `import { User, Prisma } from '@prisma/client';` ，会发现 `User` 模型中已经有了 `tel` 字段了，在运行上面的命令之前是没有的；

这里有一个问题，以上的改动都是在本地 `node_modules` 目录下的 `index.d.ts`体现的，相当于修改了本地的文件，不过这份文件不会被 git 跟踪，所以不会被提交到 git 仓库。发版的时候怎么办呢？本地开发环境的`node_modules` 目录下的 `index.d.ts`和目标环境的`node_modules` 目录下的 `index.d.ts`是不一致的，所以我们需要手动同步一下。

发版的时候，需要执行以下命令去迁移合并：

```bash
npx prisma migrate deploy
## 注意：迁移部署通常应该是自动化CI/CD管道的一部分，我们不建议在本地运行此命令以将更改部署到生产数据库。
```

这样就可以完成模型变化的迁移了
