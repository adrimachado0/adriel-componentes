# Adriel Componentes

Tienda simple de componentes de PC usados. El comprador arma un carrito y consulta por WhatsApp.

## Desarrollo (Docker)

No hace falta Node en tu máquina: todo corre en el contenedor.

```bash
cp .env.example .env.local      # completá las variables
docker compose up               # http://localhost:3000
```

Otros comandos:

```bash
docker compose run --rm app npm run lint
docker compose run --rm app npm run typecheck
docker compose run --rm app npm test
docker compose run --rm app npm run build
docker compose run --rm app npm run check   # todo lo anterior
docker compose run --rm app npm install <paquete>
```

Si cambia `Dockerfile.dev`: `docker compose build`.

## Deploy en Vercel

1. **Subí el repo a GitHub** (`git remote add origin <url> && git push -u origin main`).
2. **Vercel → Add New → Project** e importá el repo. Detecta Next.js solo; dejá el build por defecto.
3. **Variables de entorno** (Production y Preview), las mismas de `.env.example`:

   | Variable                        | Valor                                                                           |
   | ------------------------------- | ------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://<proyecto>.supabase.co`                                                |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la _publishable key_ (`sb_publishable_…`). **Nunca** la `service_role` / secret |
   | `NEXT_PUBLIC_SITE_URL`          | `https://tudominio.com` (sin `/` final)                                         |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER`   | `5493416165720`                                                                 |
   | `NEXT_PUBLIC_CONTACT_EMAIL`     | `adrielmachadodev@gmail.com`                                                    |

   Son `NEXT_PUBLIC_*`: se incrustan al compilar, así que **si cambiás una, volvé a desplegar**.

4. **Dominio**: Vercel → Project → Settings → Domains → agregá `tudominio.com` (y `www`). En Namecheap → Advanced DNS cargá exactamente los registros que te muestra Vercel.
5. **Supabase → Authentication → URL Configuration**:
   - _Site URL_: `https://tudominio.com`
   - _Redirect URLs_: `https://tudominio.com/**` (y, si usás previews, `https://*.vercel.app/**`).
6. **Probá en producción**: la tienda, el login en `/admin`, cargar un producto con foto y compartir un link por WhatsApp para ver la vista previa (WhatsApp cachea las vistas previas: probá con un producto nuevo).

No corras `supabase/seed.sql` en producción: es solo para desarrollo.
