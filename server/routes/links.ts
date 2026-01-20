import { Router, type Request, type Response } from 'express';
import type { Server } from 'socket.io';
import { getDb, rowToLink } from '../db.js';

export function createLinksRouter(io: Server): Router {
  const router = Router();
  const db = getDb();

  // GET /api/links - List all links
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await db.execute('SELECT * FROM links ORDER BY created_at DESC');
      const links = result.rows.map((row) => rowToLink(row as Record<string, unknown>));
      res.json(links);
    } catch (error) {
      console.error('Error fetching links:', error);
      res.status(500).json({ error: 'Failed to fetch links' });
    }
  });

  // GET /api/links/:id - Get single link
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM links WHERE id = ?',
        args: [req.params.id],
      });

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      const link = rowToLink(result.rows[0] as Record<string, unknown>);
      res.json(link);
    } catch (error) {
      console.error('Error fetching link:', error);
      res.status(500).json({ error: 'Failed to fetch link' });
    }
  });

  // POST /api/links - Create new link
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, sourceId, targetId, description, type, url, createdAt, updatedAt } = req.body;

      if (!id || !sourceId || !targetId || !description || !type) {
        res.status(400).json({ error: 'id, sourceId, targetId, description, and type are required' });
        return;
      }

      // Verify source and target people exist
      const sourceExists = await db.execute({
        sql: 'SELECT id FROM people WHERE id = ?',
        args: [sourceId],
      });
      const targetExists = await db.execute({
        sql: 'SELECT id FROM people WHERE id = ?',
        args: [targetId],
      });

      if (sourceExists.rows.length === 0 || targetExists.rows.length === 0) {
        res.status(400).json({ error: 'Source or target person not found' });
        return;
      }

      await db.execute({
        sql: `INSERT INTO links (id, source_id, target_id, description, type, url, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          sourceId,
          targetId,
          description,
          type,
          url || null,
          createdAt,
          updatedAt,
        ],
      });

      const link = {
        id,
        sourceId,
        targetId,
        description,
        type,
        url,
        createdAt,
        updatedAt,
      };

      // Emit socket event
      io.emit('link:created', link);

      res.status(201).json(link);
    } catch (error) {
      console.error('Error creating link:', error);
      res.status(500).json({ error: 'Failed to create link' });
    }
  });

  // PUT /api/links/:id - Update link
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { sourceId, targetId, description, type, url, updatedAt } = req.body;

      // Check if link exists
      const existing = await db.execute({
        sql: 'SELECT * FROM links WHERE id = ?',
        args: [req.params.id],
      });

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      await db.execute({
        sql: `UPDATE links SET
              source_id = ?,
              target_id = ?,
              description = ?,
              type = ?,
              url = ?,
              updated_at = ?
              WHERE id = ?`,
        args: [
          sourceId,
          targetId,
          description,
          type,
          url || null,
          updatedAt,
          req.params.id,
        ],
      });

      const link = {
        id: req.params.id,
        sourceId,
        targetId,
        description,
        type,
        url,
        createdAt: (existing.rows[0] as Record<string, unknown>).created_at as string,
        updatedAt,
      };

      // Emit socket event
      io.emit('link:updated', link);

      res.json(link);
    } catch (error) {
      console.error('Error updating link:', error);
      res.status(500).json({ error: 'Failed to update link' });
    }
  });

  // DELETE /api/links/:id - Delete link
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      // Check if link exists
      const existing = await db.execute({
        sql: 'SELECT * FROM links WHERE id = ?',
        args: [req.params.id],
      });

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }

      await db.execute({
        sql: 'DELETE FROM links WHERE id = ?',
        args: [req.params.id],
      });

      // Emit socket event
      io.emit('link:deleted', { id: req.params.id });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting link:', error);
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  return router;
}
