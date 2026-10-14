import type { Metadata } from 'next';
import { CabinetSimulator } from '@/components/assembly-guide/CabinetSimulator';

export const metadata: Metadata = { title: 'Befun 캐비넷 모의 조립', description: '우리 캐비넷의 실제 부품을 한 개씩 선택하고 조립해 보세요.' };
export default function CabinetAssemblyPage() { return <CabinetSimulator />; }
