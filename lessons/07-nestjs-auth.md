# Урок 07 — NestJS: JWT авторизация и RBAC

## Зачем нужна авторизация

Без авторизации любой человек мог бы:
- Просмотреть данные всех клиентов
- Удалить любую запись
- Изменить финансовые данные

Нам нужна двухуровневая защита:
1. **Аутентификация** — ты вошёл в систему? (кто ты)
2. **Авторизация** — у тебя есть права? (что тебе можно)

---

## JWT — JSON Web Token

JWT — это зашифрованный токен, который содержит информацию о пользователе.

### Как выглядит JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5Ac3BvcnRtYXgucnUiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDYwNDgwMH0.signature
```

Три части, разделённые точками:
1. **Header** — алгоритм шифрования
2. **Payload** — данные (можно раскодировать, поэтому не храним пароли!)
3. **Signature** — подпись (только сервер может создать)

Раскодированный payload:
```json
{
  "sub": 1,              // ID сотрудника
  "email": "admin@sportmax.ru",
  "role": "ADMIN",
  "iat": 1700000000,     // создан в (timestamp)
  "exp": 1700604800      // истекает в (7 дней)
}
```

### Поток аутентификации

```
1. Пользователь: POST /auth/login { email, password }
        │
        ▼
2. AuthService.login():
   - Найти сотрудника по email
   - bcrypt.compare(password, passwordHash) → true/false
   - Если OK: создать JWT токен
        │
        ▼
3. Ответ: { access_token: "eyJ...", user: {...} }
        │
        ▼
4. Браузер: сохранить токен в localStorage
        │
        ▼
5. Каждый запрос: Authorization: Bearer eyJ...
        │
        ▼
6. JwtAuthGuard: проверить подпись токена → данные пользователя
```

---

## AuthModule — код авторизации

### auth.service.ts

```typescript
// apps/api/src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // 1. Найти сотрудника
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email }
    })

    // 2. Проверить существование и активность
    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // 3. Проверить пароль (bcrypt — медленный хэш, защита от брутфорса)
    const isPasswordValid = await bcrypt.compare(dto.password, staff.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    // 4. Создать JWT токен
    const token = this.jwt.sign({
      sub: staff.id,      // subject = ID пользователя
      email: staff.email,
      role: staff.role,
    })

    return { access_token: token, user: { ...staff, passwordHash: undefined } }
  }
}
```

### JwtStrategy — проверка токена

```typescript
// apps/api/src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Берём токен из заголовка: "Authorization: Bearer eyJ..."
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  // Этот метод вызывается АВТОМАТИЧЕСКИ при каждом запросе с токеном
  async validate(payload: { sub: number; email: string; role: string }) {
    // payload — раскодированный JWT
    const staff = await this.prisma.staff.findUnique({
      where: { id: payload.sub }
    })

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException()
    }

    // Возвращаем объект — он будет доступен как request.user
    return staff
  }
}
```

---

## Guards — охранники

Guard — класс, который решает: пустить запрос дальше или нет.

### JwtAuthGuard

```typescript
// apps/api/src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // AuthGuard('jwt') автоматически вызывает JwtStrategy.validate()
  // Если validate() бросает ошибку → 401 Unauthorized
  // Если OK → кладёт результат в request.user
}
```

Использование:
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)   // применить к одному методу
getProfile() { ... }

@Controller('clients')
@UseGuards(JwtAuthGuard)   // применить ко ВСЕМ методам контроллера
export class ClientsController { ... }
```

---

## RBAC — Role-Based Access Control

RBAC = разграничение доступа по ролям. Разные роли — разный доступ.

### Роли в нашей системе

```typescript
// packages/shared/src/types/enums.ts
enum Role {
  ADMIN     = 'ADMIN',     // всё разрешено
  MANAGER   = 'MANAGER',   // CRM, клиенты, сделки
  RECEPTION = 'RECEPTION', // посещения, оплаты, RFID
  TRAINER   = 'TRAINER',   // расписание, занятия
  DIRECTOR  = 'DIRECTOR',  // аналитика, финансы
}
```

### @Roles() декоратор

```typescript
// apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'
import { Role } from '@prisma/client'

export const ROLES_KEY = 'roles'
// Функция, которая помечает метод метаданными
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
```

### RolesGuard

```typescript
// apps/api/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Прочитать метаданные: какие роли требуются?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),  // метаданные метода
      context.getClass(),    // метаданные класса
    ])

    // Если ролей не задано — разрешаем всем
    if (!requiredRoles?.length) return true

    // Получить текущего пользователя из запроса
    const { user } = context.switchToHttp().getRequest()

    // Проверить что роль пользователя есть в списке разрешённых
    return requiredRoles.includes(user?.role)
  }
}
```

### Использование в контроллере

```typescript
// apps/api/src/modules/finance/finance.controller.ts

@Get('stats')
@Roles('ADMIN', 'DIRECTOR', 'MANAGER')    // разрешить только этим ролям
@UseGuards(JwtAuthGuard, RolesGuard)       // оба guard-а
getStats() {
  return this.financeService.getDashboardStats()
}

// Reception не может видеть финансовую статистику
// Trainer не может видеть финансовую статистику
// Manager может видеть
```

---

## @CurrentUser() декоратор

```typescript
// apps/api/src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user  // то, что вернул JwtStrategy.validate()
  },
)

// Использование:
@Post('deals')
createDeal(@Body() body: any, @CurrentUser() user: Staff) {
  // user.id — ID текущего сотрудника
  return this.crmService.createDeal({
    ...body,
    createdById: user.id  // автоматически подставляем кто создал
  })
}
```

---

## Хэширование паролей (bcrypt)

Никогда не храним пароли в открытом виде!

```typescript
// Регистрация нового сотрудника:
import * as bcrypt from 'bcryptjs'

const password = 'admin123'
const saltRounds = 12  // чем больше — тем медленнее (защита от брутфорса)

const hash = await bcrypt.hash(password, saltRounds)
// hash = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Проверка при входе:
const isValid = await bcrypt.compare('admin123', hash)  // true
const isValid = await bcrypt.compare('wrong', hash)     // false
```

В seed файле:
```typescript
// apps/api/prisma/seed.ts
const passwordHash = await bcrypt.hash('admin123', 12)
await prisma.staff.create({
  data: {
    email: 'admin@sportmax.ru',
    passwordHash,  // храним только хэш
    role: 'ADMIN',
  }
})
```

---

## Задание

1. Откройте Swagger: http://localhost:3001/docs
2. Нажмите "Authorize" → введите email/пароль через `POST /auth/login`
3. Скопируйте `access_token` из ответа
4. Вставьте в поле "Authorize" (формат: `Bearer eyJ...`)
5. Теперь попробуйте `GET /finance/stats` — должно работать с ролью ADMIN
6. **Попробуйте:** создайте нового сотрудника с ролью RECEPTION в seed файле и проверьте что он НЕ может видеть финансы

---

**Предыдущий урок:** [06 — NestJS основы](./06-nestjs-basics.md)
**Следующий урок:** [08 — Next.js основы](./08-nextjs-basics.md)
