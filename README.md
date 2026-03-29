# Vipers - Restaurant Pager Web App

App web para restaurantes estilo pager:

- El SUPERADMIN crea locales y les asigna una cuenta administradora.
- La cuenta del local (ADMIN) crea pedido con numero y local.
- Se genera QR unico para ese pedido.
- El cliente escanea el QR, se loguea y el pedido queda asociado automaticamente.
- Cuando ADMIN/SUPERADMIN marca READY, el cliente recibe aviso en la web y push (si esta habilitado).

## Stack

- Next.js 16 + TypeScript
- Prisma + PostgreSQL
- NextAuth (credentials + Google/Facebook/GitHub opcional)
- Firebase Cloud Messaging (push web)
- QR con react-qr-code

## Setup rapido

1. Instalar dependencias:

pnpm install

2. Variables de entorno:

- Ya hay un .env local configurado con tu DATABASE_URL.
- Usa .env.example como referencia para completar OAuth/Firebase.

3. Sincronizar base de datos:

pnpm db:push

4. Levantar app:

pnpm dev

## Rutas principales

- /superadmin alta de local + cuenta del local (solo SUPERADMIN)
- /admin panel operativo de pedidos (ADMIN del local o SUPERADMIN)
- /claim/[token] claim de pedido por QR
- /my-orders panel del cliente con estado y notificaciones
- /login y /register autenticacion

## Roles

- SUPERADMIN: define SUPERADMIN_EMAILS en .env (emails separados por coma).
- SUPERADMIN es el unico que puede crear locales y asociar una cuenta a cada local.
- ADMIN: cuenta asociada al local, puede crear pedidos y marcar READY en su local.

## Notificaciones y garantia real

No existe garantia absoluta de push web en todos los navegadores/dispositivos.
Para hacerlo robusto, esta app usa tres capas:

1. Push web por Firebase.
2. Notificacion persistente en base de datos (siempre queda registrada).
3. Actualizacion continua en pantalla cliente (polling).

## Comandos utiles

- pnpm lint
- pnpm build
- pnpm db:generate
- pnpm db:push
- pnpm db:studio

