import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const beforeHash="c242959d3f600cf28ce24f1af8ba6221c44ea24c54b9bfb7552f93c09536504f",afterHash="cca8c3f3f5c7e5fef8ba48ef4fafc8cea113e05ca68ae974530ecd044f68d4f9";
const changes=[
  [
    "import {createSelfPurchaseNavigation} from './self-purchase-navigation.ts';\n",
    ""
  ],
  [
    "    <ClientContent\n      runtime={runtime}\n",
    "    <ClientContent\n"
  ],
  [
    "export function ClientContent({\n  runtime,\n",
    "export function ClientContent({\n"
  ],
  [
    "  runtime?: ApplicationSession;\n",
    ""
  ],
  [
    "          onSelfPurchase={runtime&&ports.care?createSelfPurchaseNavigation(runtime,controller,boundary,navigator):undefined}\n",
    ""
  ]
];
const clientEntryAfterHash="c2f4dd95759ab5da5baa85ffc8db8b0dc203ce37da56ee6807dea0b09cfdb3d0";
const clientEntryChanges=[
  [
    "import {AdvisorClientApplication} from \"./AdvisorClientEntry.tsx\";",
    "import { PublicationAudit } from \"./PublicationAudit.tsx\";"
  ],
  [
    "<AdvisorClientApplication\n          runtime={runtime}\n          clientId={route.clientId}\n          clientName={connection.controller.getSnapshot().clients?.clients.find(c=>c.clientId.toLowerCase()===route.clientId.toLowerCase())?.displayName??null}",
    "<AdvisorClientRecovery\n          clientId={route.clientId}\n          controller={connection.controller}"
  ],
  [
    "function AdvisorPreview(",
    "function AdvisorClientRecovery({\n  clientId,\n  controller,\n  publication,\n  adapterCare,\n  boundary,\n}: {\n  clientId: string;\n  controller: AdvisorController;\n  publication: ReturnType<typeof createAdvisorPorts>[\"publication\"];\n  adapterCare: ReturnType<typeof createAdvisorPorts>[\"care\"];\n  boundary: PlanSessionBoundary;\n}) {\n  const [audit, setAudit] = useState(false);\n  const state = useSyncExternalStore(\n    controller.subscribe,\n    controller.getSnapshot,\n    controller.getSnapshot,\n  );\n  useEffect(() => {\n    void controller.loadClients();\n    void controller.loadDirectory();\n  }, [controller]);\n  const client = state.clients?.clients.find((c) => c.clientId === clientId),\n    drafts =\n      state.directory?.drafts.filter((d) => d.clientId === clientId) ?? [];\n  return (\n    <>\n      <PageHeader title={client?.displayName ?? \"client workspace\"} />\n      {state.notice ? (\n        <StatusNotice tone=\"error\" title={state.notice.title} />\n      ) : null}\n      {drafts.map((d) => (\n        <RouteLink\n          key={d.id}\n          route={{ name: \"advisor-editor\", draftId: d.id, section: \"sources\" }}\n        >\n          open draft\n        </RouteLink>\n      ))}\n      {state.clients && state.directory && !drafts.length ? (\n        <StatusNotice title=\"no draft found\">\n          open plans to create and deliberately assign an unassigned draft.\n        </StatusNotice>\n      ) : null}\n      <RouteLink route={{ name: \"advisor-plans\" }}>open plans</RouteLink>\n      {client && client.publishedVersion > 0 ? (\n        <Button variant=\"secondary\" onClick={() => setAudit(true)}>\n          read current publication\n        </Button>\n      ) : null}\n      {audit ? (\n        <PublicationAudit\n          key={clientId}\n          clientId={clientId}\n          read={publication}\n          care={adapterCare}\n          session={boundary}\n        />\n      ) : null}\n    </>\n  );\n}\nfunction AdvisorPreview("
  ]
];
/** Preserve the original Account integration witness only after exact whole-file
 * identity and exact five-clause reversal. This does not accept the new action. */
export function selfPurchaseApplicationPreimage(source){
 if(sha(source)==='9ff9dfb2273ad80262ea00236c04e7671e4dd59d98c737665c05459b94f40510'){
  for(const [after,original] of [
   ['    isApplicable(): boolean;\n',''],
   ['    let active = true;\n    const adapter = createAdvisorPorts(runtime, { care: true });','    const adapter = createAdvisorPorts(runtime, { care: true });'],
   ['    const isApplicable = () => {\n      if (!active || runtime.getSnapshot().boundary !== boundary) return false;\n      const current = boundary.isCurrent();\n      return current && active && runtime.getSnapshot().boundary === boundary;\n    };\n    setConnection({ adapter, controller, isApplicable });','    setConnection({ adapter, controller });'],
   ['      active = false;\n      controller.dispose();\n      adapter.dispose();','      controller.dispose();\n      adapter.dispose();'],
   ['          isApplicable={connection.isApplicable}\n',''],
  ]){
   const index=source.indexOf(after);
   if(index<0||source.indexOf(after,index+1)>=0)throw Error('ambiguous advisor lifetime seam');
   source=source.slice(0,index)+original+source.slice(index+after.length);
  }
  if(sha(source)!=='640839a7abaa2079c60665e89896c05d87fe57fe7a6d12eb99b6d8a8f1dcbec5')throw Error('advisor lifetime inverse mismatch');
 }
 if(sha(source)==='640839a7abaa2079c60665e89896c05d87fe57fe7a6d12eb99b6d8a8f1dcbec5'){
  for(const [after,original] of [
   ['import { AdvisorWorkspaceNotifications } from "./AdvisorWorkspaceNotifications.tsx";','import { AdvisorWorkspace } from "../features/advisor/AdvisorWorkspace.tsx";'],
   ['<AdvisorWorkspaceNotifications\n          runtime={runtime}\n','<AdvisorWorkspace\n'],
  ]){
   const index=source.indexOf(after);
   if(index<0||source.indexOf(after,index+1)>=0)throw Error('ambiguous notification composition seam');
   source=source.slice(0,index)+original+source.slice(index+after.length);
  }
  if(sha(source)!=='02acf950ab71a21cbe71bdb6ddd83c458173120f8a4791d9ebb4f5b4f365d11b')throw Error('notification composition inverse mismatch');
 }
 if(sha(source)==='02acf950ab71a21cbe71bdb6ddd83c458173120f8a4791d9ebb4f5b4f365d11b'){
  const after='{route.name === "notifications" || route.name === "advisor-notifications" ? (';
  const original='{route.name === "notifications" ? (';
  const index=source.indexOf(after);
  if(index<0||source.indexOf(after,index+1)>=0)throw Error('ambiguous notification route seam');
  source=source.slice(0,index)+original+source.slice(index+after.length);
  if(sha(source)!==clientEntryAfterHash)throw Error('notification route inverse mismatch');
 }
 if(sha(source)===clientEntryAfterHash){
  for(const [after,original] of clientEntryChanges){
   const index=source.indexOf(after);
   if(index<0||source.indexOf(after,index+1)>=0)throw Error('ambiguous client entry seam');
   source=source.slice(0,index)+original+source.slice(index+after.length);
  }
  if(sha(source)!==afterHash)throw Error('client entry inverse mismatch');
 }
 const hash=sha(source);if(hash===beforeHash)return source;
 if(hash!==afterHash)throw Error('unknown application postimage');
 let before=source;
 for(const [after,original] of changes){
  const index=before.indexOf(after);
  if(index<0||before.indexOf(after,index+1)>=0)throw Error('ambiguous application seam');
  before=before.slice(0,index)+original+before.slice(index+after.length);
 }
 if(sha(before)!==beforeHash)throw Error('application inverse mismatch');return before;
}
