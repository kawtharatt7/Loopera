const STEPS = [
  {
    title: "Show it",
    body: "A photo, a sketch, or a few words. The AI only reads what the piece is made of.",
    icon: <path d="M4 7h3l2-3h6l2 3h3v12H4Z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />,
  },
  {
    title: "We count",
    body: "Code works out every round and checks that each one adds up before you see it.",
    icon: <path d="M5 5h14v14H5Z M9 9h6M9 12h6M9 15h3" />,
  },
  {
    title: "Make or buy",
    body: "Crochet it yourself from the PDF, or send the design to a maker to crochet for you.",
    icon: <path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20Z" />,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-t border-line/10 py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="how-heading" className="text-center text-3xl sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-4xl border border-line/10 bg-surface/50 p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ember">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                    {s.icon}
                  </svg>
                </span>
                <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-2xl">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
