// Verifies RLS/Storage policies against the real project using the public
// (anon/publishable) key and NO session. Reads must work; every write must fail.
//
//   docker compose run --rm -T app npm run test:rls
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// 1. Public read works.
const { data: rows, error: readError } = await supabase
  .from("products")
  .select("id, title, stock");
check(
  "anon can read products",
  !readError && rows.length > 0,
  readError?.message ?? `${rows?.length} rows`,
);
const target = rows?.[0];
const before = rows?.length ?? 0;

// 2. Insert is rejected.
const { error: insertError } = await supabase
  .from("products")
  .insert({ title: "RLS test", price: 1 });
check(
  "anon cannot insert",
  Boolean(insertError),
  insertError?.code ?? "insert succeeded!",
);

// 3. Update affects no rows (RLS hides them from UPDATE).
if (target) {
  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({ price: 1 })
    .eq("id", target.id)
    .select("id");
  check(
    "anon cannot update",
    Boolean(updateError) || updated.length === 0,
    updateError?.code ?? `${updated.length} rows updated`,
  );

  // 4. Delete affects no rows.
  const { data: deleted, error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", target.id)
    .select("id");
  check(
    "anon cannot delete",
    Boolean(deleteError) || deleted.length === 0,
    deleteError?.code ?? `${deleted.length} rows deleted`,
  );
}

const { count: after } = await supabase
  .from("products")
  .select("id", { count: "exact", head: true });
check("row count unchanged", after === before, `${before} → ${after}`);

// 5. Storage upload is rejected.
const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
  type: "image/png",
});
const { error: uploadError } = await supabase.storage
  .from("product-images")
  .upload(`products/rls-test-${Date.now()}.png`, png);
check(
  "anon cannot upload images",
  Boolean(uploadError),
  uploadError?.message ?? "upload succeeded!",
);

// 6. Bucket cannot be listed.
const { data: listed, error: listError } = await supabase.storage
  .from("product-images")
  .list("products");
check(
  "anon cannot list the bucket",
  Boolean(listError) || listed.length === 0,
  listError?.message ?? `${listed.length} objects visible`,
);

console.log(failures === 0 ? "\nRLS OK" : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
