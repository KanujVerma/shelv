# Public Maya preview capability probe

Owner: Kanuj. **Preview supported; own blank tab closed and interval returned. No product test.** Execution `e7c5e427-1109-4064-b502-8e0267b77a65`, once-only W0 admission of unchanged packet SHA256 `540bf6dd9d95c536402ec5043fe718b82bd483a6dd150b991afdd1dc07da6606`. [Exact result and private raw reference](PUBLIC_MAYA_PREVIEW_PROBE_R1_RESULT.json).

At01:48:45UTC, W7 invoked preview_open once with exactly open:false/profileId:incognito/reuseExistingTab:false, URL omitted. The interface returned one caller-owned blank tab with null URL/title. No navigation followed. W7 called window.close only on that actual returned ID, then verified its status available:false/tabId:null at01:48:54UTC. Nine seconds is within the admitted30-second interval. No existing tab was touched or adopted. The preceding status available:false indicated no open preview tab; it did not establish an unsupported browser.

Raw open/cleanup/status/clock results are retained private0600. This proves the specified own-tab closure, not global browser/process absence. There was no server, app page, screenshot, Node/Playwright fallback, Auth/DB/SQL/Storage fixture or real business operation. No active W7 grant remains.

The actual public Maya page must use the supported preview interface under a separately prepared and admitted exact packet. This probe transfers no authority to that test or another browser. Published df230 source/build pins remain preparatory evidence only; full current census is NOT_MEASURED and all acceptance counters/holds remain unchanged.
