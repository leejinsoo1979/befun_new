import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#e9eaea]">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-800">Befun</h1>
        <p className="mb-8 text-lg text-gray-600">
          나만의 맞춤 수납 가구를 디자인하세요
        </p>
        <Link
          href="/configurator"
          className="rounded-full bg-gray-800 px-8 py-3 text-white transition-colors hover:bg-gray-700"
        >
          디자인 시작하기
        </Link>
      </div>
    </div>
  );
}
