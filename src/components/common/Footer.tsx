export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-gray-500">
          <p className="font-semibold text-gray-700">Befun</p>
          <p>나만의 맞춤 수납 가구</p>
          <div className="flex gap-4">
            <span>이용약관</span>
            <span>개인정보처리방침</span>
            <span>고객센터</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Befun. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
