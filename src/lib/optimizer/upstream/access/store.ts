// [Befun shim] 250709in의 Firebase 권한(등급별 기능) 대신 옵티마이저 기능을 모두 허용한다.
// 페이지 접근 제어는 Befun 라우트(`/optimizer`)에서 한다.
import { create } from 'zustand';

type FeatureId = string;

interface AccessState {
  ready: boolean;
  features: FeatureId[];
}

export const useFeatureAccessStore = create<AccessState>(() => ({ ready: true, features: [] }));
export const canUseFeature = (_feature: FeatureId): boolean => true;
export const useFeature = (_feature: FeatureId): boolean => true;
