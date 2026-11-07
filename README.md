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
