import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = Router();

// POST /api/upload - Upload one or more image files
router.post('/', async (req: Request, res: Response) => {
  try {
    const { file, files } = req.body;

    const toProcess: Array<{ filename?: string; data: string }> = [];

    if (file && typeof file.data === 'string') {
      toProcess.push(file);
    } else if (Array.isArray(files)) {
      for (const f of files) {
        if (f && typeof f.data === 'string') {
          toProcess.push(f);
        }
      }
    } else if (typeof req.body.data === 'string') {
      toProcess.push({ filename: req.body.filename, data: req.body.data });
    }

    if (toProcess.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni pour le téléversement.' });
    }

    const savedUrls: string[] = [];

    for (const item of toProcess) {
      // data format: data:image/png;base64,iVBORw0KGgo...
      let mimeType = 'image/jpeg';
      let base64Data = item.data;

      if (item.data.startsWith('data:')) {
        const matches = item.data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          return res.status(400).json({ error: 'Format de données image invalide.' });
        }
      }

      // Check mime type
      if (!mimeType.startsWith('image/')) {
        return res.status(400).json({ error: 'Seuls les fichiers image sont acceptés.' });
      }

      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

      const buffer = Buffer.from(base64Data, 'base64');

      // Max 10MB per image
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'La taille d’une image ne doit pas dépasser 10 Mo.' });
      }

      const uniqueFilename = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      await fs.promises.writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${uniqueFilename}`);
    }

    return res.status(201).json({
      message: `${savedUrls.length} image(s) téléversée(s) avec succès.`,
      url: savedUrls[0],
      urls: savedUrls,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Erreur lors du traitement du téléversement.' });
  }
});

// DELETE /api/upload - Delete an uploaded image
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL d’image requise.' });
    }

    // Only allow deleting files inside /uploads/
    if (!url.startsWith('/uploads/')) {
      return res.json({ message: 'Suppression locale effectuée' });
    }

    const filename = path.basename(url);
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return res.json({ message: 'Image supprimée avec succès.' });
  } catch (err: any) {
    console.error('Delete upload error:', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l’image.' });
  }
});

export default router;

