
// src/routes/entrenador.routes.ts
import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/entrenadores
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Lista de entrenadores',
    data: []
  });
});

// GET /api/entrenadores/:id
router.get('/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: `Detalles del entrenador ${req.params.id}`,
    data: { id: req.params.id, nombre: 'Entrenador Ejemplo' }
  });
});

export default router;
