import { ogImage } from "@/lib/ogImage";

export { ogSize as size, ogContentType as contentType, ogAlt as alt } from "@/lib/ogImage";

export default function Image() {
  return ogImage();
}
