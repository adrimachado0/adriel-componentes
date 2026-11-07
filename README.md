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
   | `NEXT_PUBLIC_SITE_URL`          | `https://tudominio.com` (sin `/` final). Es la base de los links de Open Graph  |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER`   | `5493416165720`                                                                 |
   | `NEXT_PUBLIC_CONTACT_EMAIL`     | `adrielmachadodev@gmail.com`                                                    |

   Son `NEXT_PUBLIC_*`: se incrustan al compilar, así que **si cambiás una, volvé a desplegar**.

4. **Dominio**: Vercel → Project → Settings → Domains → agregá `tudominio.com` (y `www`). En Namecheap → Advanced DNS cargá exactamente los registros que te muestra Vercel.
5. **Supabase → Authentication → URL Configuration**:
   - _Site URL_: `https://tudominio.com`
   - _Redirect URLs_: `https://tudominio.com/**` (y, si usás previews, `https://*.vercel.app/**`).
6. **Probá en producción**: la tienda, el login en `/admin`, cargar un producto con foto y compartir un link por WhatsApp para ver la vista previa (WhatsApp cachea las vistas previas: probá con un producto nuevo).

No corras `supabase/seed.sql` en producción: es solo para desarrollo.

## Vista previa al compartir (Open Graph)

- Cada producto comparte una imagen JPEG de **1200 × 630 px**: la "Imagen para compartir" que cargues en el formulario (se recorta desde el centro) o, si no hay, la portada completa.
- Medida ideal para cargar: **1200 × 630 px** (horizontal, 1.91:1), mínimo 600 × 315. Lo importante, en el centro.
- La URL de la imagen cambia cada vez que guardás el producto, así WhatsApp/Facebook no muestran una versión vieja.
- `NEXT_PUBLIC_SITE_URL` tiene que ser tu dominio real. Si en Vercel quedó `localhost`, se usa automáticamente el dominio de producción del proyecto.
- Para revisar cómo se ve: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (también renueva la caché de WhatsApp/Instagram) o pegá el link en un chat de WhatsApp.
