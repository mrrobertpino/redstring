export function validContent(kind, content) {
  if (typeof content !== 'string' || !content.trim()) return false;
  if (kind === 'note') return content.length <= 4000;
  if (kind === 'link') {
    try { const url = new URL(content); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && content.length <= 2000; } catch { return false; }
  }
  return kind === 'image' && content.length <= 200000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(content);
}
export function validateSubmission(item) {
  for (const [key, max] of [['name',80],['title',120],['reason',2000]]) {
    if (typeof item[key] !== 'string' || !item[key].trim() || item[key].length > max) throw Error(`Please complete ${key} (up to ${max} characters).`);
  }
  if (!validContent(item.kind,item.content)) throw Error('Use a valid note, http/https link, or supported image.');
  if (typeof item.cluster !== 'string' || item.cluster.length > 80) throw Error('Cluster names must be 80 characters or fewer.');
  if (!Number.isFinite(item.x) || !Number.isFinite(item.y) || item.x < 100 || item.x > 1300 || item.y < 100 || item.y > 850) throw Error('Place your draft within the board.');
  if (!Array.isArray(item.links) || item.links.length > 20 || item.links.some(id => typeof id !== 'string' || id.length > 100)) throw Error('Choose up to 20 connections.');
  return item;
}
export function mergeBoard(seed, published) {
  const items = new Map(seed.items.map(item=>[item.id,item]));
  for (const item of published) if(validContent(item.kind,item.content)) items.set(item.id,item);
  const connections=seed.connections.filter(pair=>pair.every(id=>items.has(id)));
  for(const item of published) for(const id of item.links||[]) if(id!==item.id && items.has(id) && !connections.some(pair=>pair.includes(id)&&pair.includes(item.id)))connections.push([item.id,id]);
  return {items:[...items.values()],connections,clusters:seed.clusters||[],...(seed.strings?{strings:seed.strings}:{})};
}
