import Composer from "@/components/composer/Composer";
export default function ComposerPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Post</h1>
      <Composer />
    </main>
  );
}
