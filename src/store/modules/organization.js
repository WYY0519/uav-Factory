import { defineStore } from 'pinia';

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    currentOrgName: '', // 当前组织名称
    currentOrgId: '' // 当前组织ID
  }),
  actions: {
    setCurrentOrg(org) {
      console.log(org,"orgStore11111111111");
      this.currentOrgName = org.name; // 设置当前组织名称
      this.currentOrgId = org.organizationId;
    }
  }
});

