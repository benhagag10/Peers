import { Router, type Request, type Response } from 'express';
import type { Server } from 'socket.io';
import { getDb, rowToPerson } from '../db.js';

export function createPeopleRouter(io: Server): Router {
  const router = Router();
  const db = getDb();

  // GET /api/people - List all people
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await db.execute('SELECT * FROM people ORDER BY created_at DESC');
      const people = result.rows.map((row) => rowToPerson(row as Record<string, unknown>));
      res.json(people);
    } catch (error) {
      console.error('Error fetching people:', error);
      res.status(500).json({ error: 'Failed to fetch people' });
    }
  });

  // GET /api/people/:id - Get single person
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM people WHERE id = ?',
        args: [req.params.id],
      });

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }

      const person = rowToPerson(result.rows[0] as Record<string, unknown>);
      res.json(person);
    } catch (error) {
      console.error('Error fetching person:', error);
      res.status(500).json({ error: 'Failed to fetch person' });
    }
  });

  // POST /api/people - Create new person
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { id, name, affiliation, photoUrl, peeps, stream, interests, position, createdAt, updatedAt } = req.body;

      if (!id || !name || !position) {
        res.status(400).json({ error: 'id, name, and position are required' });
        return;
      }

      await db.execute({
        sql: `INSERT INTO people (id, name, affiliation, photo_url, peeps, stream, interests, position_x, position_y, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          name,
          affiliation || null,
          photoUrl || null,
          peeps || null,
          stream || null,
          interests ? JSON.stringify(interests) : null,
          position.x,
          position.y,
          createdAt,
          updatedAt,
        ],
      });

      const person = {
        id,
        name,
        affiliation,
        photoUrl,
        peeps,
        stream,
        interests,
        position,
        createdAt,
        updatedAt,
      };

      // Emit socket event
      io.emit('person:created', person);

      res.status(201).json(person);
    } catch (error) {
      console.error('Error creating person:', error);
      res.status(500).json({ error: 'Failed to create person' });
    }
  });

  // PUT /api/people/:id - Update person
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { name, affiliation, photoUrl, peeps, stream, interests, position, updatedAt } = req.body;

      // Check if person exists
      const existing = await db.execute({
        sql: 'SELECT * FROM people WHERE id = ?',
        args: [req.params.id],
      });

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }

      await db.execute({
        sql: `UPDATE people SET
              name = ?,
              affiliation = ?,
              photo_url = ?,
              peeps = ?,
              stream = ?,
              interests = ?,
              position_x = ?,
              position_y = ?,
              updated_at = ?
              WHERE id = ?`,
        args: [
          name,
          affiliation || null,
          photoUrl || null,
          peeps || null,
          stream || null,
          interests ? JSON.stringify(interests) : null,
          position.x,
          position.y,
          updatedAt,
          req.params.id,
        ],
      });

      const person = {
        id: req.params.id,
        name,
        affiliation,
        photoUrl,
        peeps,
        stream,
        interests,
        position,
        createdAt: (existing.rows[0] as Record<string, unknown>).created_at as string,
        updatedAt,
      };

      // Emit socket event
      io.emit('person:updated', person);

      res.json(person);
    } catch (error) {
      console.error('Error updating person:', error);
      res.status(500).json({ error: 'Failed to update person' });
    }
  });

  // DELETE /api/people/:id - Delete person
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      // Check if person exists
      const existing = await db.execute({
        sql: 'SELECT * FROM people WHERE id = ?',
        args: [req.params.id],
      });

      if (existing.rows.length === 0) {
        res.status(404).json({ error: 'Person not found' });
        return;
      }

      // Delete associated links first (even though we have ON DELETE CASCADE, emit events)
      const links = await db.execute({
        sql: 'SELECT id FROM links WHERE source_id = ? OR target_id = ?',
        args: [req.params.id, req.params.id],
      });

      for (const link of links.rows) {
        io.emit('link:deleted', { id: (link as Record<string, unknown>).id });
      }

      // Delete the person (cascade will handle links in DB)
      await db.execute({
        sql: 'DELETE FROM people WHERE id = ?',
        args: [req.params.id],
      });

      // Emit socket event
      io.emit('person:deleted', { id: req.params.id });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting person:', error);
      res.status(500).json({ error: 'Failed to delete person' });
    }
  });

  return router;
}
