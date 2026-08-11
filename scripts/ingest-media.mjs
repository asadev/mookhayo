#!/usr/bin/env node
/**
 * ingest-media — turn a folder of raw footage into web assets + a PROJECTS manifest.
 *
 *   node scripts/ingest-media.mjs ~/Downloads/muhayyo-work
 *   node scripts/ingest-media.mjs ~/Downloads/muhayyo-work --category real-estate --year 2026
 *
 * Reads every video/image in the source folder and writes, into public/media/work/:
 *   <slug>.mp4        H.264 + faststart, capped at 1080p on the long edge
 *   <slug>.webp       poster frame (videos) or the optimised still (images)
 * then prints a ready-to-paste PROJECTS array for src/content/site.ts.
 *
 * Why a script and not "just drag the files in": her work is phone-shot Reels and
 * property tours straight out of an editor — 4K, 60-100MB, HEVC in a .mov. Dropping
 * those into /public means a portfolio that takes forty seconds to show its first
 * frame, which is a worse advert for her than showing nothing.
 *
 * Requires ffmpeg + ffprobe on PATH. Node 18+.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.tif', '.tiff']);

const OUT_DIR = path.resolve(process.cwd(), 'public/media/work');
const PUBLIC_PREFIX = '/media/work';

/** Long edge cap. 1080 is plenty for a web gallery and keeps Reels crisp. */
const MAX_EDGE = 1080;

function slugify(name) {
  return path
    .basename(name, path.extname(name))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'clip';
}

async function probe(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,duration:stream_tags=rotate',
    '-show_entries', 'format=duration',
    '-of', 'json',
    file,
  ]);
  const meta = JSON.parse(stdout);
  const s = meta.streams?.[0] ?? {};
  let w = Number(s.width) || 0;
  let h = Number(s.height) || 0;
  // A phone shooting vertical writes landscape dimensions plus a rotate tag.
  // Ignore it and you build a gallery where every Reel is on its side.
  const rotate = Math.abs(Number(s.tags?.rotate ?? 0)) % 180;
  if (rotate === 90) [w, h] = [h, w];
  const duration = Number(s.duration ?? meta.format?.duration ?? 0);
  return { width: w, height: h, duration };
}

/** Scale filter that caps the long edge and keeps dimensions even (H.264 requires it). */
function scaleFilter(w, h) {
  const long = Math.max(w, h);
  if (long <= MAX_EDGE) return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  return w >= h
    ? `scale=${MAX_EDGE}:-2`
    : `scale=-2:${MAX_EDGE}`;
}

async function encodeVideo(src, slug, meta) {
  const mp4 = path.join(OUT_DIR, `${slug}.mp4`);
  const poster = path.join(OUT_DIR, `${slug}.webp`);

  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', src,
    '-vf', scaleFilter(meta.width, meta.height),
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-crf', '23',
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    // gallery clips are muted and looped — the audio is dead weight over the wire
    '-an',
    // without faststart the moov atom lands at the end and the browser must
    // download the whole file before the first frame appears
    '-movflags', '+faststart',
    mp4,
  ]);

  // Grab the poster a beat in: frame 0 of a graded clip is very often black.
  const at = meta.duration > 2 ? Math.min(1.2, meta.duration / 3) : 0;
  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(at),
    '-i', src,
    '-frames:v', '1',
    '-vf', scaleFilter(meta.width, meta.height),
    '-q:v', '80',
    poster,
  ]);

  return { mp4, poster };
}

async function encodeImage(src, slug, meta) {
  const out = path.join(OUT_DIR, `${slug}.webp`);
  await run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', src,
    '-vf', scaleFilter(meta.width, meta.height),
    '-q:v', '82',
    out,
  ]);
  return { out };
}

function kb(n) {
  return `${(n / 1024).toFixed(0)} KB`;
}

async function main() {
  const [srcDir, ...rest] = process.argv.slice(2);
  if (!srcDir) {
    console.error('usage: node scripts/ingest-media.mjs <source-folder> [--category <id>] [--year <yyyy>]');
    process.exit(1);
  }

  const flag = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 && rest[i + 1] ? rest[i + 1] : fallback;
  };
  const category = flag('category', 'commercial');
  const year = Number(flag('year', new Date().getFullYear()));

  await mkdir(OUT_DIR, { recursive: true });

  const entries = (await readdir(path.resolve(srcDir), { withFileTypes: true }))
    .filter((d) => d.isFile() && !d.name.startsWith('.'))
    .map((d) => path.join(path.resolve(srcDir), d.name))
    .sort();

  const manifest = [];
  const seen = new Set();

  for (const file of entries) {
    const ext = path.extname(file).toLowerCase();
    const isVideo = VIDEO_EXT.has(ext);
    const isImage = IMAGE_EXT.has(ext);
    if (!isVideo && !isImage) continue;

    let slug = slugify(file);
    let n = 2;
    while (seen.has(slug)) slug = `${slugify(file)}-${n++}`;
    seen.add(slug);

    try {
      const meta = await probe(file);
      if (!meta.width || !meta.height) {
        console.warn(`  ! skipped (no video stream): ${path.basename(file)}`);
        continue;
      }
      const ratio = Number((meta.width / meta.height).toFixed(4));

      if (isVideo) {
        const { mp4, poster } = await encodeVideo(file, slug, meta);
        const size = (await stat(mp4)).size;
        console.log(`  video  ${slug}  ${meta.width}x${meta.height}  ${meta.duration.toFixed(1)}s  -> ${kb(size)}`);
        manifest.push({
          id: slug,
          kind: 'video',
          src: `${PUBLIC_PREFIX}/${path.basename(mp4)}`,
          poster: `${PUBLIC_PREFIX}/${path.basename(poster)}`,
          ratio,
          year,
          category,
        });
      } else {
        const { out } = await encodeImage(file, slug, meta);
        const size = (await stat(out)).size;
        console.log(`  image  ${slug}  ${meta.width}x${meta.height}  -> ${kb(size)}`);
        manifest.push({
          id: slug,
          kind: 'image',
          src: `${PUBLIC_PREFIX}/${path.basename(out)}`,
          ratio,
          year,
          category,
        });
      }
    } catch (err) {
      console.warn(`  ! failed: ${path.basename(file)} — ${err.message.split('\n')[0]}`);
    }
  }

  if (!manifest.length) {
    console.log('\nNothing ingested.');
    return;
  }

  console.log(`\n${manifest.length} item(s) written to public/media/work/\n`);
  console.log('Paste into src/content/site.ts, replacing `export const PROJECTS: Project[] = [];`');
  console.log('Set each `category` (real-estate | commercial | social | education | event)');
  console.log('and add `client` where it is cleared for publication.\n');
  console.log('export const PROJECTS: Project[] = [');
  for (const m of manifest) {
    const parts = [
      `id: '${m.id}'`,
      `kind: '${m.kind}'`,
      `src: '${m.src}'`,
      m.poster ? `poster: '${m.poster}'` : null,
      `ratio: ${m.ratio}`,
      `year: ${m.year}`,
      `category: '${m.category}'`,
    ].filter(Boolean);
    console.log(`  { ${parts.join(', ')} },`);
  }
  console.log('];');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
