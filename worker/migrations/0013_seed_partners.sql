-- Carga inicial de partners actuales (sin DGG ni Synetics, que el cliente
-- pidió quitar). A partir de aquí se administran desde el panel de admin.
INSERT INTO partners (name, image_url, link_url, badge, featured, position, created_at) VALUES
  ('STgenetics', 'https://geneticauniversal.com/assets/media/asset-04-2202aea3e2.png', 'https://stgen.com', NULL, 0, 0, '2026-09-21T00:00:00.000Z'),
  ('Westlock Genetics', 'https://geneticauniversal.com/assets/media/asset-03-5317918973.png', 'https://westlockgenetics.com', NULL, 0, 1, '2026-09-21T00:00:00.000Z'),
  ('Neogen', 'https://geneticauniversal.com/assets/media/asset-07-b3adf6b884.png', 'https://neogen.com', NULL, 0, 2, '2026-09-21T00:00:00.000Z'),
  ('AI Total', 'https://geneticauniversal.com/assets/media/ai-total-logo.png', 'https://ai-totalus.com', NULL, 0, 3, '2026-09-21T00:00:00.000Z'),
  ('Granja Morelos', 'https://geneticauniversal.com/assets/media/granja-morelos-logo.png', 'https://granjamorelos.com', 'A2', 0, 4, '2026-09-21T00:00:00.000Z'),
  ('GONVAX', 'https://geneticauniversal.com/assets/media/asset-08-8c700958f5.png', 'https://gonvax.com', NULL, 1, 5, '2026-09-21T00:00:00.000Z');
