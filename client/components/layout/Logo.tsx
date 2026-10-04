import { Image } from "../ui/image";

const SIZES = {
  default: "w-[220px] h-[92px]",
  small: "w-[240px] h-[50px]",
} as const;

type LogoProps = {
  variant?: keyof typeof SIZES;
  className?: string;
};

const Logo: React.FC<LogoProps> = ({ variant = "default", className }) => {
  return (
    <Image
      size="none"
      className={`shrink-0 ${SIZES[variant]} ${className ?? ""}`}
      source={require("@/assets/logo.png")}
      alt="MWH Logo"
      resizeMode="contain"
    />
  );
};

export default Logo;
