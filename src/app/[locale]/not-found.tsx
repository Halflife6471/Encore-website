import Link from "next/link";
import { en } from "@/lib/dictionaries/en";
import { sw } from "@/lib/dictionaries/sw";

/** Bilingual 404 – avoids request-time APIs so the rest of the segment can be statically generated. */
export default function NotFound() {
  return (
    <div className="container-x py-28 text-center">
      <p className="text-8xl font-extrabold text-gold">404</p>
      <h1 className="mt-4 text-4xl font-bold">{en.common.notFoundTitle}</h1>
      <p className="mt-3 text-g3">{en.common.notFoundText}</p>
      <h2 className="mt-8 text-2xl font-semibold text-g3">{sw.common.notFoundTitle}</h2>
      <p className="mt-2 text-g3">{sw.common.notFoundText}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/en" className="btn btn-primary">{en.common.backHome}</Link>
        <Link href="/sw" className="btn btn-outline">{sw.common.backHome}</Link>
      </div>
    </div>
  );
}
