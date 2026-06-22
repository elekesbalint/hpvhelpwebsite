import { redirect } from "next/navigation";

/** Referenciák oldal egyelőre nem elérhető – vissza a főoldalra. */
export default function ReferenciakRedirect() {
  redirect("/");
}
