import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MprMachineProfile } from '@/lib/optimizer/upstream/domain/boring/mprProduction';

/** 제조 파트너 단말 설정. 디자인/모듈 데이터에는 장비 값을 저장하지 않는다. */
export const useMprMachineProfileStore = create<{
  profile?: MprMachineProfile;
  setProfile: (profile: MprMachineProfile) => void;
}>()(persist(set => ({
  profile: undefined,
  setProfile: profile => set({ profile }),
}), { name: 'mmmcraft-mpr-machine-profile-v1' }));
