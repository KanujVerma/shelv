/** Shared route grammar for authenticated recovery and the typed portal. Navigation grants no authority. */
const CLIENT_NAVIGATION = [
  { label: "your plan", route: { name: "plan", routine: "morning" }, icon: "plan" },
  { label: "check-ins & history", route: { name: "history" }, icon: "history" },
  { label: "orders", route: { name: "orders" }, icon: "orders" },
  { label: "account", route: { name: "account" }, icon: "account" }
];
const sections = /* @__PURE__ */ new Set(["sources", "client-context", "decisions", "routine", "follow-up", "review-publish"]);
const clientTasks = /* @__PURE__ */ new Set(["overview", "draft", "payments", "checkins", "history", "service"]);
const simpleRoutes = {
  history: "/history",
  "history-new": "/history/new",
  orders: "/orders",
  account: "/account",
  "account-service": "/account/service",
  "account-cancel": "/account/cancel",
  notifications: "/notifications",
  "advisor-clients": "/advisor/clients",
  "advisor-plans": "/advisor/plans",
  "advisor-permissions": "/advisor/permissions"
};
function validId(value) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_:.-]{0,159}$/.test(value) && value !== "..";
}
function id(value) {
  if (!validId(value)) throw new TypeError("invalid route identity");
  return encodeURIComponent(value);
}
function routineQuery(routine) {
  if (routine !== "morning" && routine !== "evening") throw new TypeError("invalid routine");
  return routine === "evening" ? "?routine=evening" : "";
}
function buildRoute(route) {
  if (route.name in simpleRoutes) return simpleRoutes[route.name];
  switch (route.name) {
    case "plan":
      return "/plan" + routineQuery(route.routine);
    case "recommendation":
      return "/plan/recommendations/" + id(route.decisionId) + routineQuery(route.routine);
    case "product":
    case "product-evidence":
    case "product-use":
      return "/plan/products/" + id(route.productId) + (route.name === "product" ? "" : route.name === "product-evidence" ? "/evidence" : "/use") + routineQuery(route.routine);
    case "history-event":
      if (route.eventId === "new") throw new TypeError("reserved history route");
      return "/history/" + id(route.eventId);
    case "history-version":
      return "/history/versions/" + id(route.version);
    case "order":
      return "/orders/" + id(route.orderId);
    case "advisor-client":
      if (route.task && !clientTasks.has(route.task)) throw new TypeError("invalid client task");
      return "/advisor/clients/" + id(route.clientId) + (route.task ? "?task=" + route.task : "");
    case "advisor-editor":
      if (!sections.has(route.section)) throw new TypeError("invalid editor section");
      return "/advisor/plans/" + id(route.draftId) + "/" + route.section;
    case "advisor-preview":
      return "/advisor/plans/" + id(route.draftId) + "/preview";
    case "advisor-review":
      return "/advisor/reviews/" + id(route.reportId);
    case "maya":
      if (![1, 2, 3, 4, 5].includes(route.stage)) throw new TypeError("invalid guide stage");
      return "/maya" + (route.stage === 1 ? "" : "?stage=" + route.stage);
    default:
      throw new TypeError("unknown route");
  }
}
function allowedQuery(url, keys) {
  return [...url.searchParams.keys()].every((key) => keys.includes(key) && url.searchParams.getAll(key).length === 1);
}
function legacyRoute(url) {
  const q = url.searchParams, audience = q.get("workspace");
  if (!q.size) return { name: "plan", routine: "morning" };
  if (audience === "client" && allowedQuery(url, ["workspace", "clientView", "product"])) {
    const view = q.get("clientView") ?? "routine", product = q.get("product");
    if (product && ["routine", "recommendations"].includes(view) && validId(product)) return { name: "product", productId: product, routine: "morning" };
    if (product) return null;
    if (["routine", "recommendations"].includes(view)) return { name: "plan", routine: "morning" };
    if (["history", "checkins"].includes(view)) return { name: "history" };
    if (view === "payments") return { name: "orders" };
    if (view === "service") return { name: "account-service" };
    if (view === "about") return { name: "account" };
  }
  if (audience === "advisor" && allowedQuery(url, ["workspace", "advisorClient", "advisorTask"])) {
    const client = q.get("advisorClient"), task = q.get("advisorTask");
    if (task && (!client || !clientTasks.has(task))) return null;
    if (client && validId(client)) return { name: "advisor-client", clientId: client, ...task ? { task } : {} };
    if (!client && !task) return { name: "advisor-clients" };
  }
  return null;
}
function parseRoute(path) {
  if (typeof path !== "string" || path.length > 600 || !path.startsWith("/") || path.startsWith("//") || /[\\#\u0000-\u0020\u007f]/.test(path)) return null;
  if (/(?:^|\/)(?:\.|%2e){1,2}(?:\/|\?|$)/i.test(path)) return null;
  let url;
  try {
    url = new URL(path, "https://portal.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://portal.invalid") return null;
  if (url.pathname === "/") return legacyRoute(url);
  const isPlan = url.pathname === "/plan" || url.pathname.startsWith("/plan/");
  if (!allowedQuery(url, isPlan ? ["routine"] : url.pathname === "/maya" ? ["stage"] : /^\/advisor\/clients\/[^/]+$/.test(url.pathname) ? ["task"] : [])) return null;
  const routine = url.searchParams.get("routine") ?? "morning";
  if (isPlan && !["morning", "evening"].includes(routine)) return null;
  if (url.pathname === "/plan") return { name: "plan", routine };
  for (const [name, value] of Object.entries(simpleRoutes)) if (url.pathname === value) return { name };
  if (url.pathname === "/maya") {
    const stage = url.searchParams.get("stage") ?? "1";
    return /^[1-5]$/.test(stage) ? { name: "maya", stage: Number(stage) } : null;
  }
  let parts;
  try {
    parts = url.pathname.slice(1).split("/").map(decodeURIComponent);
  } catch {
    return null;
  }
  if (parts.some((part) => !validId(part))) return null;
  const [a, b, c, d] = parts;
  if (a === "plan" && b === "recommendations" && parts.length === 3) return { name: "recommendation", decisionId: c, routine };
  if (a === "plan" && b === "products" && (parts.length === 3 || parts.length === 4 && ["evidence", "use"].includes(d))) return { name: !d ? "product" : d === "evidence" ? "product-evidence" : "product-use", productId: c, routine };
  if (a === "history" && b === "versions" && parts.length === 3) return { name: "history-version", version: c };
  if (a === "history" && parts.length === 2) return { name: "history-event", eventId: b };
  if (a === "orders" && parts.length === 2) return { name: "order", orderId: b };
  if (a === "advisor" && b === "clients" && parts.length === 3) {
    const task = url.searchParams.get("task");
    if (task && !clientTasks.has(task)) return null;
    return { name: "advisor-client", clientId: c, ...task ? { task } : {} };
  }
  if (a === "advisor" && b === "reviews" && parts.length === 3) return { name: "advisor-review", reportId: c };
  if (a === "advisor" && b === "plans" && parts.length === 4) {
    if (d === "preview") return { name: "advisor-preview", draftId: c };
    if (sections.has(d)) return { name: "advisor-editor", draftId: c, section: d };
  }
  return null;
}
function safeReturnPath(path, audience) {
  const route = parseRoute(path);
  if (!route || route.name === "maya" || route.name.startsWith("advisor-") !== (audience === "advisor")) return null;
  return buildRoute(route);
}
function parentRoute(route) {
  switch (route.name) {
    case "product-evidence":
    case "product-use":
      return { name: "product", productId: route.productId, routine: route.routine };
    case "product":
    case "recommendation":
      return { name: "plan", routine: route.routine };
    case "history-new":
    case "history-event":
    case "history-version":
      return { name: "history" };
    case "order":
      return { name: "orders" };
    case "account-service":
    case "account-cancel":
      return { name: "account" };
    case "advisor-client":
      return { name: "advisor-clients" };
    case "advisor-editor":
    case "advisor-preview":
      return { name: "advisor-plans" };
    case "advisor-review":
      return { name: "advisor-clients" };
    default:
      return route.name.startsWith("advisor-") ? { name: "advisor-clients" } : { name: "plan", routine: "morning" };
  }
}
export {
  CLIENT_NAVIGATION,
  buildRoute,
  parentRoute,
  parseRoute,
  safeReturnPath
};
