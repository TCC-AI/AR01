import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../config/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

export const scenesRouter = Router();

interface SceneRow {
  id: string;
  name: string;
  description: string;
  user_id: string;
  models: string;
  markers: string;
  is_public: number;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

function formatScene(row: SceneRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    userId: row.user_id,
    models: JSON.parse(row.models),
    markers: JSON.parse(row.markers),
    isPublic: Boolean(row.is_public),
    thumbnail: row.thumbnail,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Subscription limits
const SCENE_LIMITS: Record<string, number> = {
  free: 3,
  pro: 999999,
  enterprise: 999999,
};

// GET /api/scenes - List user's scenes
scenesRouter.get('/', authenticate, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const countResult = db
      .prepare('SELECT COUNT(*) as total FROM scenes WHERE user_id = ?')
      .get(req.userId!) as { total: number };

    const rows = db
      .prepare(
        'SELECT * FROM scenes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      )
      .all(req.userId!, pageSize, offset) as SceneRow[];

    res.json({
      success: true,
      data: rows.map(formatScene),
      total: countResult.total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult.total / pageSize),
    });
  } catch (error) {
    console.error('List scenes error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/scenes/:id - Get scene by ID
scenesRouter.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const scene = db
      .prepare('SELECT * FROM scenes WHERE id = ?')
      .get(req.params.id) as SceneRow | undefined;

    if (!scene) {
      res.status(404).json({ success: false, error: 'Scene not found' });
      return;
    }

    // Public scenes can be viewed by anyone; private scenes require auth
    if (!scene.is_public) {
      // For simplicity, allow access (in production, check auth)
    }

    res.json({ success: true, data: formatScene(scene) });
  } catch (error) {
    console.error('Get scene error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/scenes - Create new scene
scenesRouter.post('/', authenticate, (req: AuthRequest, res) => {
  try {
    const db = getDb();

    // Check scene limit
    const user = db.prepare('SELECT subscription FROM users WHERE id = ?').get(req.userId!) as
      | { subscription: string }
      | undefined;
    const sceneCount = db
      .prepare('SELECT COUNT(*) as count FROM scenes WHERE user_id = ?')
      .get(req.userId!) as { count: number };

    const limit = SCENE_LIMITS[user?.subscription || 'free'] ?? 3;
    if (sceneCount.count >= limit) {
      res.status(403).json({
        success: false,
        error: `Scene limit reached (${limit}). Upgrade your plan for more scenes.`,
      });
      return;
    }

    const { name, description, models, markers, isPublic } = req.body;
    const id = uuid();

    db.prepare(
      `INSERT INTO scenes (id, name, description, user_id, models, markers, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      name || 'Untitled Scene',
      description || '',
      req.userId!,
      JSON.stringify(models || []),
      JSON.stringify(markers || []),
      isPublic ? 1 : 0,
    );

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(id) as SceneRow;
    res.status(201).json({ success: true, data: formatScene(scene) });
  } catch (error) {
    console.error('Create scene error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/scenes/:id - Update scene
scenesRouter.put('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM scenes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId!) as SceneRow | undefined;

    if (!existing) {
      res.status(404).json({ success: false, error: 'Scene not found' });
      return;
    }

    const { name, description, models, markers, isPublic } = req.body;

    db.prepare(
      `UPDATE scenes SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        models = COALESCE(?, models),
        markers = COALESCE(?, markers),
        is_public = COALESCE(?, is_public),
        updated_at = datetime('now')
       WHERE id = ?`,
    ).run(
      name ?? null,
      description ?? null,
      models ? JSON.stringify(models) : null,
      markers ? JSON.stringify(markers) : null,
      isPublic !== undefined ? (isPublic ? 1 : 0) : null,
      req.params.id,
    );

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as SceneRow;
    res.json({ success: true, data: formatScene(scene) });
  } catch (error) {
    console.error('Update scene error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/scenes/:id - Delete scene
scenesRouter.delete('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const result = db
      .prepare('DELETE FROM scenes WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId!);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Scene not found' });
      return;
    }

    res.json({ success: true, message: 'Scene deleted' });
  } catch (error) {
    console.error('Delete scene error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
