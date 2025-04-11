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
│   └── 20201207100915_init
│       └── migration.sql
└── schema.prisma
```

检查数据库，会发现已经生成了对应的表

## prisma-client

接下来我们通过 prisma-client 来操作数据库

```bash
npm install @prisma/client
```
