// [Befun shim] 250709in 로고 대신 Befun 텍스트 로고.
interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  loading?: boolean;
  noAnimation?: boolean;
  color?: string;
}

export default function Logo({ size = 'medium', onClick, color }: LogoProps) {
  const fontSize = size === 'large' ? 22 : size === 'small' ? 14 : 18;
  return (
    <span onClick={onClick} style={{ fontSize, fontWeight: 700, color: color ?? 'inherit', cursor: onClick ? 'pointer' : undefined }}>
      Befun
    </span>
  );
}
