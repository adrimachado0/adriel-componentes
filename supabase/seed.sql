-- Development seed: the sample products from design/ (no photos).
-- Staggered created_at so the Home order matches Main.dc.html (newest first).
-- The last one has stock 0 to exercise "Vendido" (admin list and "Ya vendidos").

insert into public.products (title, description, brand, price, stock, created_at) values
  ('Memoria RAM Fury Beast 16 GB (2×8) DDR4 3200 MHz',
   'Kit de dos módulos, funcionando perfecto. Sacado de una PC de uso hogareño.',
   'Kingston', 38000, 2, now() - interval '1 minute'),
  ('Placa de video GeForce GTX 1660 Super 6 GB',
   E'Modelo Ventus XS. Nunca usada para minería, con caja original.\nFunciona perfecto: la saqué porque actualicé la PC. Se entrega limpia y con pasta térmica renovada.',
   'MSI', 185000, 1, now() - interval '2 minutes'),
  ('SSD NVMe 980 512 GB M.2',
   'En muy buen estado. Ideal como disco de sistema.',
   'Samsung', 42000, 3, now() - interval '3 minutes'),
  ('Procesador Ryzen 5 3600 AM4',
   'Incluye el cooler Wraith Stealth original. Sin pines doblados.',
   'AMD', 95000, 1, now() - interval '4 minutes'),
  ('Fuente CX650M 650 W 80 Plus Bronze',
   'Semi-modular, con todos los cables y la caja.',
   'Corsair', 70000, 1, now() - interval '5 minutes'),
  ('Motherboard B450M DS3H AM4',
   'BIOS actualizado, compatible con Ryzen 5000. Con tapa trasera.',
   'Gigabyte', 80000, 1, now() - interval '6 minutes'),
  ('Disco rígido Barracuda 1 TB 7200 rpm',
   'Formateado y testeado, sin sectores dañados.',
   'Seagate', 25000, 4, now() - interval '7 minutes'),
  ('Cooler de CPU Hyper 212',
   'Con pasta térmica nueva y todos los anclajes.',
   'Cooler Master', 30000, 2, now() - interval '8 minutes'),
  ('Fuente 500 W 80 Plus White',
   'Funciona bien, ideal para una PC de oficina.',
   'EVGA', 30000, 0, now() - interval '9 minutes');
