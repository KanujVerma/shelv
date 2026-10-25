import { AdvisorSessionObject as ProductionSessionObject } from '../../workers/session-vault/index';

// Local workerd-only instrumentation. Production build entry points never include this module.
export class AdvisorSessionObject extends ProductionSessionObject {
    async testRunAlarm() {
        await this.ctx.storage.deleteAlarm();
        await this.alarm();
    }
    async testGetAlarm() { return this.ctx.storage.getAlarm(); }
}
export { default } from '../../workers/session-vault/index';
