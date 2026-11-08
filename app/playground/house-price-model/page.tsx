import { redirect } from "next/navigation";

// Old address, kept so links that were already shared still work.
export default function OldLabAddress() {
  redirect("/playground/king-county-house-prices#try");
}
