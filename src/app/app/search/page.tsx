import UserSearchBar from "@/components/UserSearchBar";

export default function SearchPage() {
  return (
    <section aria-labelledby="search-title" className="mx-auto max-w-2xl">
      <p className="eyebrow mb-2">Discover</p>
      <h1 id="search-title" className="font-editorial text-5xl leading-none tracking-tight sm:text-6xl">
        Find people
      </h1>
      <p className="mt-3 text-muted">Search by name or username to find someone on You.</p>
      <div className="card mt-6 p-5 sm:p-6">
        <UserSearchBar focusOnMount />
      </div>
    </section>
  );
}
