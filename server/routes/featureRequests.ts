import { Router, type Request, type Response } from 'express';
import type { Server } from 'socket.io';
import { getDb, rowToFeatureRequest } from '../db.js';

export function createFeatureRequestsRouter(io: Server): Router {
  const router = Router();
  const db = getDb();

  // GET /api/feature-requests - List all feature requests
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await db.execute('SELECT * FROM feature_requests ORDER BY created_at DESC');
      const requests = result.rows.map((row) => rowToFeatureRequest(row as Record<string, unknown>));
      res.json(requests);
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      res.status(500).json({ error: 'Failed to fetch feature requests' });
    }
  });

  // POST /api/feature-requests - Create new feature request
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, authorName, requestText, createdAt } = req.body;

      if (!id || !requestText) {
        res.status(400).json({ error: 'id and requestText are required' });
        return;
      }

      await db.execute({
        sql: `INSERT INTO feature_requests (id, author_name, request_text, created_at)
              VALUES (?, ?, ?, ?)`,
        args: [id, authorName || null, requestText, createdAt],
      });

      const featureRequest = {
        id,
        authorName: authorName || null,
        requestText,
        createdAt,
      };

      // Emit socket event
      io.emit('featureRequest:created', featureRequest);

      res.status(201).json(featureRequest);
    } catch (error) {
      console.error('Error creating feature request:', error);
      res.status(500).json({ error: 'Failed to create feature request' });
    }
  });

  // DELETE /api/feature-requests/:id - Delete feature request
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const existing = await db.execute({
        sql: 'SELECT * FROM feature_requests WHERE id = ?',
        args: [req.params.id],
      });

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Feature request not found' });
        return;
      }

      await db.execute({
        sql: 'DELETE FROM feature_requests WHERE id = ?',
        args: [req.params.id],
      });

      // Emit socket event
      io.emit('featureRequest:deleted', { id: req.params.id });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting feature request:', error);
      res.status(500).json({ error: 'Failed to delete feature request' });
    }
  });

  return router;
}
