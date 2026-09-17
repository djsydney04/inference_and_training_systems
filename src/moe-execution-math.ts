/** Original CPU arithmetic model: no GPU, network, learned router or full expert MLP. */
export type Matrix = number[][];
export interface ExpertRoute { token: number; expert: number; choice: number; weight: number }
export interface RoutingPlan {
  probabilities: Matrix; routes: ExpertRoute[]; counts: number[];
  tokens: number; experts: number; k: number; normalizeSelected: boolean;
}

function matrix(value: Matrix, name: string) {
  if (!value.length || !value[0].length || value.some(row => row.length !== value[0].length || row.some(x => !Number.isFinite(x))))
    throw new RangeError(`${name} must be a nonempty rectangular finite matrix`);
}
export function softmax(values: readonly number[]) {
  if (!values.length || values.some(x => !Number.isFinite(x))) throw new RangeError("finite logits required");
  const largest = Math.max(...values), exp = values.map(x => Math.exp(x - largest));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(x => x / sum);
}

/** Ties choose the smaller expert ID. Selected-softmax is one explicitly chosen router. */
export function routeTokens(logits: Matrix, k: number, normalizeSelected = true): RoutingPlan {
  matrix(logits, "logits");
  const experts = logits[0].length;
  if (!Number.isSafeInteger(k) || k < 1 || k > experts) throw new RangeError("k must be between 1 and expert count");
  const probabilities = logits.map(softmax), counts = Array(experts).fill(0) as number[];
  const routes = probabilities.flatMap((p, token) => {
    const selected = p.map((_, expert) => expert).sort((a, b) => logits[token][b] - logits[token][a] || a - b).slice(0, k);
    const mass = normalizeSelected ? selected.reduce((sum, e) => sum + p[e], 0) : 1;
    return selected.map((expert, choice) => { counts[expert]++; return {token, expert, choice, weight: p[expert] / mass}; });
  });
  return {probabilities, routes, counts, tokens: logits.length, experts, k, normalizeSelected};
}

/** A capacity policy changes the accepted route set. Selection priority is token ID, then choice. */
export function limitCapacity(plan: RoutingPlan, capacity: number, renormalize: boolean) {
  if (!Number.isSafeInteger(capacity) || capacity < 0) throw new RangeError("capacity must be a nonnegative integer");
  const counts = Array(plan.experts).fill(0) as number[], dropped: ExpertRoute[] = [], kept: ExpertRoute[] = [];
  for (const route of [...plan.routes].sort((a, b) => a.token - b.token || a.choice - b.choice)) {
    if (counts[route.expert] < capacity) { counts[route.expert]++; kept.push({...route}); }
    else dropped.push({...route});
  }
  const mass = Array(plan.tokens).fill(0) as number[];
  for (const route of kept) mass[route.token] += route.weight;
  if (renormalize) for (const route of kept) route.weight = mass[route.token] > 0 ? route.weight / mass[route.token] : 0;
  return {routes: kept, dropped, counts, survivingMass: mass,
    emptyTokens: mass.flatMap((value, token) => value === 0 ? [token] : [])};
}

function validateExperts(inputs: Matrix, experts: Matrix[], routes: ExpertRoute[]) {
  matrix(inputs, "inputs");
  if (!experts.length) throw new RangeError("at least one expert required");
  const width = experts[0][0]?.length;
  for (const expert of experts) {
    matrix(expert, "expert");
    if (expert.length !== inputs[0].length || expert[0].length !== width) throw new RangeError("expert shape mismatch");
  }
  const seen = new Set<string>();
  for (const route of routes) {
    if (!Number.isSafeInteger(route.token) || route.token < 0 || route.token >= inputs.length
      || !Number.isSafeInteger(route.expert) || route.expert < 0 || route.expert >= experts.length
      || !Number.isFinite(route.weight) || route.weight < 0) throw new RangeError("invalid route");
    const key = `${route.token}:${route.expert}`;
    if (seen.has(key)) throw new RangeError("duplicate token/expert assignment");
    seen.add(key);
  }
  return width;
}

/** Row-vector convention: expert e computes x W_e. Grouping never changes expert identity. */
export function groupedMoe(inputs: Matrix, experts: Matrix[], routes: ExpertRoute[]) {
  const width = validateExperts(inputs, experts, routes);
  const packed = [...routes].sort((a, b) => a.expert - b.expert || a.token - b.token);
  const outputs = inputs.map(() => Array(width).fill(0) as number[]);
  const expertOutputs = packed.map(route => {
    const value = Array.from({length: width}, (_, j) => inputs[route.token].reduce((sum, x, i) => sum + x * experts[route.expert][i][j], 0));
    for (let j = 0; j < width; j++) outputs[route.token][j] += route.weight * value[j];
    return value;
  });
  return {packed, expertOutputs, outputs};
}

/** Dropless task-loss derivatives, holding selected IDs fixed and treating logits as independent inputs. */
export function moeBackward(inputs: Matrix, experts: Matrix[], plan: RoutingPlan, upstream: Matrix) {
  const forward = groupedMoe(inputs, experts, plan.routes);
  matrix(upstream, "upstream");
  if (upstream.length !== inputs.length || upstream[0].length !== forward.outputs[0].length) throw new RangeError("upstream shape mismatch");
  const dInputs = inputs.map(row => row.map(() => 0));
  const dExperts = experts.map(w => w.map(row => row.map(() => 0)));
  const dGate = inputs.map(() => Array(plan.experts).fill(0) as number[]);
  forward.packed.forEach((route, slot) => {
    const {token: t, expert: e, weight: g} = route;
    dGate[t][e] = upstream[t].reduce((sum, u, j) => sum + u * forward.expertOutputs[slot][j], 0);
    for (let i = 0; i < inputs[t].length; i++) for (let j = 0; j < upstream[t].length; j++) {
      dInputs[t][i] += g * upstream[t][j] * experts[e][i][j];
      dExperts[e][i][j] += inputs[t][i] * g * upstream[t][j];
    }
  });
  const gates = inputs.map(() => Array(plan.experts).fill(0) as number[]);
  for (const r of plan.routes) gates[r.token][r.expert] = r.weight;
  const dLogits = gates.map((g, t) => {
    const average = g.reduce((sum, gate, e) => sum + gate * dGate[t][e], 0);
    return g.map((gate, e) => plan.normalizeSelected
      ? gate * (dGate[t][e] - average)
      : plan.probabilities[t][e] * (dGate[t][e] - average));
  });
  return {...forward, dInputs, dExperts, dGate, dLogits};
}

/** Logical uncompressed payload count; local routes do not cross the two rank boundaries. */
export function expertTraffic(routes: ExpertRoute[], tokenOwners: number[], expertOwners: number[], width: number, bytesPerValue: number) {
  for (const n of [...tokenOwners, ...expertOwners]) if (!Number.isSafeInteger(n) || n < 0 || n > 63) throw new RangeError("rank IDs must be integers in [0,63]");
  if (!tokenOwners.length || !expertOwners.length || !Number.isSafeInteger(width) || width < 1
    || !Number.isSafeInteger(bytesPerValue) || bytesPerValue < 1) throw new RangeError("positive dimensions and owner arrays required");
  const ranks = Math.max(...tokenOwners, ...expertOwners) + 1;
  const counts = Array.from({length: ranks}, () => Array(ranks).fill(0) as number[]);
  let remoteAssignments = 0;
  for (const route of routes) {
    const source = tokenOwners[route.token], destination = expertOwners[route.expert];
    if (source === undefined || destination === undefined) throw new RangeError("missing route owner");
    counts[source][destination]++;
    if (source !== destination) remoteAssignments++;
  }
  return {counts, remoteAssignments, oneWayBytes: remoteAssignments * width * bytesPerValue};
}

/** Switch-style top-1 auxiliary scalar WITHOUT alpha. Hard fractions are stop-gradient. */
export function switchBalance(logits: Matrix) {
  const plan = routeTokens(logits, 1, false), {tokens: t, experts: e} = plan;
  const fractions = plan.counts.map(n => n / t);
  const meanProbabilities = Array.from({length: e}, (_, expert) => plan.probabilities.reduce((sum, p) => sum + p[expert], 0) / t);
  const loss = e * fractions.reduce((sum, f, expert) => sum + f * meanProbabilities[expert], 0);
  const dLogits = plan.probabilities.map(p => {
    const weighted = p.reduce((sum, probability, expert) => sum + probability * fractions[expert], 0);
    return p.map((probability, expert) => e / t * probability * (fractions[expert] - weighted));
  });
  return {fractions, meanProbabilities, loss, dLogits};
}

export const moeExampleInputs = [[1, 2], [2, 1], [-1, 1], [1, -1]];
export const moeExampleExperts = [[[1, 0], [0, 1]], [[2, 0], [0, 1]], [[0, 1], [1, 0]]];
export const moeExampleProbabilities = [[0.6, 0.3, 0.1], [0.2, 0.5, 0.3], [0.1, 0.2, 0.7], [0.5, 0.4, 0.1]];
export const moeExampleLogits = moeExampleProbabilities.map(row => row.map(Math.log));
