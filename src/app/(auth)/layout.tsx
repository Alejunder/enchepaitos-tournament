import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-turf-pattern px-4 py-12">
      <Link href="/" className="text-xl font-semibold text-chalk">
        🍻 Enchepaitos Tournament
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
