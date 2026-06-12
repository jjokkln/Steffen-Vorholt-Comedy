import { revalidatePath } from "next/cache";

/** Nach jeder Admin-Mutation aufrufen: invalidiert alle öffentlichen Seiten. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}
