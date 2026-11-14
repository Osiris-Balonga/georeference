import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container page-head">
      <h1>404</h1>
      <p>Lieu ou page introuvable · Place or page not found.</p>
      <Link href="/">242Places →</Link>
    </main>
  );
}
