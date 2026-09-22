import React from "react";
import {Link} from "react-router-dom";
import {FaClock, FaEnvelope, FaPhone, FaLocationDot, FaChevronDown} from "react-icons/fa6";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import {EmptyState} from "../../components/ui/States";
import {INFO_PAGES} from "../../data/infoContent";
import {formatDate} from "../../utils/format";

/* ── block renderers ─────────────────────────────────────────────────────── */

function Section({id, title, children}) {
    return (
        <section id={id} className="mt-10 scroll-mt-24">
            {title && (
                <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
            )}
            {children}
        </section>
    );
}

const Paragraphs = ({text}) => (
    <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-600">
        {text.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
        ))}
    </div>
);

const Stats = ({items}) => (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((s) => (
            <div key={s.label} className="rounded-2xl bg-primary-50/70 p-4 text-center ring-1 ring-primary-100">
                <p className="text-2xl font-extrabold tracking-tight text-primary-700">{s.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            </div>
        ))}
    </div>
);

const Bullets = ({title, items}) => (
    <Section title={title}>
        <ul className="mt-4 space-y-3">
            {items.map((b) => (
                <li key={b.label} className="flex gap-3">
                    <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden="true"/>
                    <p className="text-[15px] leading-relaxed text-slate-600">
                        <span className="font-bold text-ink-900">{b.label} - </span>
                        {b.text}
                    </p>
                </li>
            ))}
        </ul>
    </Section>
);

const Steps = ({title, items}) => (
    <Section title={title}>
        <ol className="mt-5 space-y-4">
            {items.map((s, i) => (
                <li key={s.label} className="flex gap-4">
          <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-extrabold text-white">
            {i + 1}
          </span>
                    <div className="pt-0.5">
                        <p className="font-bold text-ink-900">{s.label}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
                    </div>
                </li>
            ))}
        </ol>
    </Section>
);

const Faq = ({title, items}) => (
    <Section title={title}>
        <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.map((f) => (
                <details key={f.q} className="group">
                    <summary
                        className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <FaChevronDown
                            size={12}
                            className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                        />
                    </summary>
                    <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
                </details>
            ))}
        </div>
    </Section>
);

const Roles = ({title, items}) => (
    <Section title={title}>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
            {items.map((r) => (
                <div key={r.title}
                     className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lift">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="teal">{r.dept}</Badge>
                        <Badge tone="slate">{r.type}</Badge>
                    </div>
                    <h3 className="mt-3 text-base font-extrabold text-ink-900">{r.title}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{r.location}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{r.blurb}</p>
                    <a
                        href={`mailto:careers@lumina.lk?subject=${encodeURIComponent(`Application - ${r.title}`)}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:underline"
                    >
                        Apply by email <FaEnvelope size={12}/>
                    </a>
                </div>
            ))}
        </div>
    </Section>
);

const Articles = ({items}) => (
    <div className="mt-6 space-y-10">
        {items.map((a) => (
            <article key={a.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="amber">{a.tag}</Badge>
                    <span className="text-xs font-bold text-slate-400">{formatDate(a.date)}</span>
                </div>
                <h2 className="mt-3 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{a.title}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-600">
                    {a.body.map((p) => (
                        <p key={p.slice(0, 40)}>{p}</p>
                    ))}
                </div>
            </article>
        ))}
    </div>
);

const InfoTable = ({title, head, rows}) => (
    <Section title={title}>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                    {head.map((h) => (
                        <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                    <tr key={r[0]} className="bg-white">
                        {r.map((cell, i) => (
                            <td key={i}
                                className={`px-4 py-3 align-top ${i === 0 ? "font-bold text-ink-900" : "text-slate-600"}`}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </Section>
);

const CONTACT_ICONS = {Email: FaEnvelope, Phone: FaPhone, Hours: FaClock, Post: FaLocationDot, Studio: FaLocationDot};

const Contact = ({title, items}) => (
    <Section title={title}>
        <div className="mt-4 space-y-2.5 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:p-6">
            {items.map((c) => {
                const Icon = CONTACT_ICONS[c.label];
                return (
                    <div key={c.label} className="flex items-start gap-3 text-sm">
                        {Icon ? (
                            <Icon className="mt-0.5 shrink-0 text-primary-600" size={14}/>
                        ) : (
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"
                                  aria-hidden="true"/>
                        )}
                        <p className="text-slate-600">
                            <span className="font-bold text-ink-900">{c.label}: </span>
                            {c.href ? (
                                <a href={c.href} className="font-bold text-primary-600 hover:underline">
                                    {c.value}
                                </a>
                            ) : (
                                c.value
                            )}
                        </p>
                    </div>
                );
            })}
        </div>
    </Section>
);

const Callout = ({text}) => (
    <p className="mt-8 rounded-2xl border-l-4 border-primary-500 bg-primary-50/70 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700">
        {text}
    </p>
);

const Cta = ({title, text, button, secondary}) => (
    <div
        className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-ink-900 p-7 text-white sm:flex-row sm:items-center sm:p-9">
        <div>
            <p className="text-lg font-extrabold tracking-tight">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <Button as={Link} to={button.to} variant="primary">
                {button.label}
            </Button>
            {secondary && (
                <Button as={Link} to={secondary.to} variant="ghost" className="text-slate-200 hover:bg-white/10">
                    {secondary.label}
                </Button>
            )}
        </div>
    </div>
);

const BLOCKS = {
    paragraphs: Paragraphs,
    stats: Stats,
    bullets: Bullets,
    steps: Steps,
    faq: Faq,
    roles: Roles,
    articles: Articles,
    table: InfoTable,
    contact: Contact,
    callout: Callout,
    cta: Cta,
};

/* ── page ────────────────────────────────────────────────────────────────── */
export default function InfoPage({slug}) {
    const page = INFO_PAGES[slug];

    if (!page) {
        return (
            <div className="lum-container py-16">
                <EmptyState
                    icon={<FaChevronDown size={26}/>}
                    title="That page has not been written yet"
                    message="The link may be outdated. Head back to the storefront or let our team know."
                    action={{label: "Back to Home", to: "/"}}
                />
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* header band */}
            <div className="border-b border-slate-100 bg-[#f4f1ec]">
                <div className="lum-container py-10 sm:py-12">
                    <Breadcrumbs items={[{label: "Home", to: "/"}, {label: page.title}]}/>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                        {page.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">{page.intro}</p>
                    {page.updated && <p className="mt-3 text-xs font-bold text-slate-400">{page.updated}</p>}
                </div>
            </div>

            {/* body */}
            <div className="lum-container max-w-3xl pb-16 pt-10">
                {page.blocks.map((b, i) => {
                    const Block = BLOCKS[b.type];
                    if (!Block) return null;
                    const key = `${b.type}-${i}`;
                    // Paragraphs without a title are plain prose; every other block
                    // renders its own container (Sections handle their titles).
                    if (b.type === "paragraphs") {
                        return b.title ? (
                            <Section key={key} title={b.title}>
                                <Paragraphs text={b.text}/>
                            </Section>
                        ) : (
                            <div key={key}>
                                <Paragraphs text={b.text}/>
                            </div>
                        );
                    }
                    return <Block key={key} {...b} />;
                })}
            </div>
        </div>
    );
}