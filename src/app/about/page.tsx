import { redirect } from "next/navigation";

export default function AboutPage() {
  // About page content is managed via admin settings
  // This page redirects to the main landing/admin for now
  redirect("/");
}
