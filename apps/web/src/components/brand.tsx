import { MapPin } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <MapPin className="brand-pin" aria-hidden="true" />
      <span>242Places</span>
    </span>
  );
}
