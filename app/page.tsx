import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";

export default async function Home() {
  const { userId } = await auth();

  const rows = userId
    ? await db.select().from(contacts).orderBy(contacts.createdAt)
    : [];

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Doula OS</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">Contacts ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            No contacts yet. POST to /api/contacts to add one.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="text-sm border rounded px-3 py-2">
                <span className="font-medium">{c.name}</span>
                {c.email && (
                  <span className="text-gray-400"> · {c.email}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
