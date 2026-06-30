import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";
import { SubmitGroupForm } from "@/components/SubmitGroupForm";

export const metadata: Metadata = {
  title: "Add your group — Global Sangha Map",
  description:
    "Submit your meditation group or event to appear on the Global Sangha Map.",
};

export default function AddYourGroupPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-5 sm:py-8">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <span aria-hidden="true">←</span> Back to the map
          </Link>
          <h1 className="text-2xl font-bold text-midnight sm:text-3xl">
            Add your group to the map
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-space-blue/80 sm:text-base">
            Help fellow practitioners find your group. Fill in the details below
            and, once approved, your gathering will appear on the Global Sangha
            Map. Fields marked <span className="text-primary">*</span> are
            required.
          </p>
        </div>

        <SubmitGroupForm />
      </main>
    </div>
  );
}
