import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, validateProject, formatDate, buildPrompt } from '../lib/project.mjs';

test('project round-trip preserves exact asset references and hidden placements', () => {
  const project = newProject();
  project.artist = 'A very long artist & band name';
  project.designs[0] = { ...project.designs[0], x: 123, rotation: -12, visible: false };
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(project))), project);
});
test('reject unsafe IDs and malformed layouts before writing files', () => {
  assert.throws(() => validateProject({ ...newProject(), id: '../outside' }));
  const project = newProject();
  project.designs[0].assetId = '../private-file';
  assert.throws(() => validateProject(project));
  assert.throws(() => validateProject({ ...newProject(), sourceUrl: 'javascript:alert(1)' }));
  assert.throws(() => validateProject({ ...newProject(), designs: new Array(13).fill(newProject().designs[0]) }));
});
test('reject duplicated slot IDs and impossible calendar dates', () => {
  const project = newProject();
  project.designs[1].id = project.designs[0].id;
  assert.throws(() => validateProject(project));
  assert.throws(() => validateProject({ ...newProject(), date: '2026-02-30' }));
});
test('US display date has no UTC day shift', () => {
  assert.equal(formatDate('2026-11-07'), 'NOV 7, 2026');
  assert.equal(formatDate(''), 'DATE TBA');
});
test('generated motifs are requested separately from poster lettering', () => {
  const prompt = buildPrompt('Test Band', 'A ribbon around a crescent moon');
  assert.match(prompt, /ONE original/);
  assert.match(prompt, /transparent/);
  assert.match(prompt, /No sheet, collage, typography, numbering/);
  assert.match(prompt, /human asymmetry/);
  assert.match(prompt, /Avoid vector-perfect geometry/);
});
