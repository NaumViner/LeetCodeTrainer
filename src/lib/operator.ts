import { productName } from "@/lib/product";

export const operator = {
  name: "נאום וינר",
  email: "naumviner@outlook.com",
} as const;

export function supportEmailHref(deletion = false) {
  return `mailto:${operator.email}?subject=${encodeURIComponent(
    deletion ? `${productName} — account deletion` : `${productName} — support`,
  )}`;
}
