import { notFound } from "next/navigation";

/** Unknown URLs under a valid locale render the localised 404. */
export default function CatchAll() {
  notFound();
}
