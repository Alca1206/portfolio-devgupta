import { redirect } from "next/navigation";

// Old address, kept so links that were already shared still work.
export default function OldWalkthroughAddress() {
  redirect("/playground/king-county-house-prices#how-it-works");
}
