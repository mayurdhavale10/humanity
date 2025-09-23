export function normalizeForX(caption: string) { return caption.slice(0, 280); }
export function normalizeForLinkedIn(caption: string) { return caption.slice(0, 3000); }
export function normalizeForInstagram(caption: string) { return caption; }
