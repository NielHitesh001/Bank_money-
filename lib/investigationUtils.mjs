export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("unterminated quoted CSV field");
  return rows;
}

export function parseCsv(text) {
  const [headers, ...rows] = parseCsvRows(text);
  if (!headers) return [];
  const normalizedHeaders = headers.map((item) => item.toLowerCase());
  return rows.map((row) => Object.fromEntries(normalizedHeaders.map((header, index) => [header, row[index] || ""])));
}

export function findDirectedPath(transactions, startId, endId) {
  if (!startId || !endId) return { nodeIds: [], edgeIds: [] };
  const outgoing = new Map();
  transactions.forEach((transaction) => {
    const edges = outgoing.get(transaction.source) || [];
    edges.push(transaction);
    outgoing.set(transaction.source, edges);
  });

  const queue = [{ nodeId: startId, edges: [], nodes: [startId] }];
  const visited = new Set([startId]);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.nodeId === endId) return { nodeIds: current.nodes, edgeIds: current.edges };
    (outgoing.get(current.nodeId) || []).forEach((transaction) => {
      if (!visited.has(transaction.target)) {
        visited.add(transaction.target);
        queue.push({ nodeId: transaction.target, edges: [...current.edges, transaction.id], nodes: [...current.nodes, transaction.target] });
      }
    });
  }
  return { nodeIds: [], edgeIds: [] };
}
