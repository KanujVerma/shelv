import { createContext, useContext, useId, useState } from "react";
import type { ReactNode } from "react";
import type { ButtonProps } from "../../ui/index.ts";
import type {
  PlanContent,
  PlanDecision,
  PlanProduct,
  RoutineStep,
  Schedule,
  Known,
  ProvenanceFact,
} from "../../../../../src/contracts/PortalRebuild.ts";
import { decisionKinds } from "../../../../../src/contracts/PortalRebuild.ts";
import type {
  Source,
  Guide,
  Fact,
  Comparison,
} from "../../../../../src/contracts/ConciergePresentation.ts";
import {
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Icon,
} from "../../ui/index.ts";

// Read affordances never inherit mutation disabling. These adapters retain the
// shared controls and their semantics, including Radix selects rendered in portals.
const MutationDisabled = createContext(false);
export function AdvisorFields({
  disabled,
  children,
}: {
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <MutationDisabled.Provider value={disabled}>
      <div className="advisor-fields">{children}</div>
    </MutationDisabled.Provider>
  );
}
function EditButton({ disabled, ...props }: ButtonProps) {
  const mutationDisabled = useContext(MutationDisabled);
  return <Button {...props} disabled={disabled || mutationDisabled} />;
}

/** Supporting sections compose the shared control layer. */
export function Disclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    id = useId();
  return (
    <div className="advisor-disclosure">
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "chevron-up" : "chevron-down"} size="small" />
        {title}
      </Button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
const identity = () => crypto.randomUUID();
export function TextField({
  label,
  value,
  onChange,
  long = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  long?: boolean;
  hint?: ReactNode;
}) {
  const disabled = useContext(MutationDisabled);
  return (
    <Field label={label} hint={hint}>
      {long ? (
        <Textarea
          readOnly={disabled}
          value={value}
          onChange={(e) => {
            if (!disabled) onChange(e.target.value);
          }}
          rows={4}
        />
      ) : (
        <Input
          readOnly={disabled}
          value={value}
          onChange={(e) => {
            if (!disabled) onChange(e.target.value);
          }}
        />
      )}
    </Field>
  );
}
export function Lines({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <TextField
      label={label}
      long
      value={value.join("\n")}
      onChange={(v) => onChange(v.split("\n"))}
    />
  );
}
export function Choice<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
}) {
  const disabled = useContext(MutationDisabled);
  return (
    <Field label={label}>
      <Select
        disabled={disabled}
        value={value}
        options={values.map((value) => ({
          value,
          label: value.replaceAll("_", " "),
        }))}
        onValueChange={(v) => onChange(v as T)}
      />
    </Field>
  );
}
function Module({
  title,
  children,
  onRemove,
  disabled = false,
}: {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="advisor-module">
      <div className="advisor-module-heading">
        <h3>{title}</h3>
        {onRemove ? (
          <EditButton variant="ghost" onClick={onRemove} disabled={disabled}>
            remove
          </EditButton>
        ) : null}
      </div>
      {children}
    </article>
  );
}
export const emptySchedule = (): Schedule => ({
  periods: [],
  days: { kind: "daily" },
  condition: null,
  asNeeded: false,
  stages: [],
  anchor: "actual_start",
  automaticAdvance: false,
});
export function ScheduleFields({
  value: s,
  onChange,
}: {
  value: Schedule;
  onChange: (v: Schedule) => void;
}) {
  const disabled = useContext(MutationDisabled);
  return (
    <div className="advisor-fields">
      <div>
        <p className="advisor-label">time of day</p>
        <div className="advisor-actions">
          {(["morning", "evening"] as const).map((period) => (
            <EditButton
              key={period}
              variant="secondary"
              aria-pressed={s.periods.includes(period)}
              onClick={() =>
                onChange({
                  ...s,
                  periods: s.periods.includes(period)
                    ? s.periods.filter((v) => v !== period)
                    : [...s.periods, period],
                })
              }
            >
              {period}
            </EditButton>
          ))}
        </div>
      </div>
      <Choice
        label="days"
        value={s.days.kind}
        values={["daily", "selected"]}
        onChange={(kind) =>
          onChange({
            ...s,
            days: kind === "daily" ? { kind } : { kind, weekdays: [] },
          })
        }
      />
      {s.days.kind === "selected" ? (
        <div className="advisor-actions" aria-label="selected weekdays">
          {(
            [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ] as const
          ).map((label, index) => {
            const day = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
              selected = s.days.kind === "selected" ? s.days.weekdays : [];
            return (
              <EditButton
                key={day}
                variant="secondary"
                aria-pressed={selected.includes(day)}
                onClick={() =>
                  onChange({
                    ...s,
                    days: {
                      kind: "selected",
                      weekdays: selected.includes(day)
                        ? selected.filter((v) => v !== day)
                        : [...selected, day],
                    },
                  })
                }
              >
                {label}
              </EditButton>
            );
          })}
        </div>
      ) : null}
      <TextField
        label="only when"
        value={s.condition ?? ""}
        onChange={(condition) =>
          onChange({ ...s, condition: condition || null })
        }
      />
      <Choice
        label="as needed"
        value={s.asNeeded ? "yes" : "no"}
        values={["yes", "no"]}
        onChange={(v) => onChange({ ...s, asNeeded: v === "yes" })}
      />
      {s.stages.map((stage, index) => (
        <Module
          key={stage.id}
          title={`introduction stage ${index + 1}`}
          onRemove={() =>
            onChange({
              ...s,
              stages: s.stages.filter((v) => v.id !== stage.id),
            })
          }
        >
          <TextField
            label="stage directions"
            long
            value={stage.directions}
            onChange={(directions) =>
              onChange({
                ...s,
                stages: s.stages.map((v) =>
                  v.id === stage.id ? { ...v, directions } : v,
                ),
              })
            }
          />
          <Field
            label="minimum days from actual start"
            hint="a minimum is not permission to advance automatically"
          >
            <Input
              disabled={disabled}
              type="number"
              min={0}
              max={3650}
              value={stage.minimumDaysFromActualStart ?? ""}
              onChange={(e) =>
                onChange({
                  ...s,
                  stages: s.stages.map((v) =>
                    v.id === stage.id
                      ? {
                          ...v,
                          minimumDaysFromActualStart:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        }
                      : v,
                  ),
                })
              }
            />
          </Field>
          <TextField
            label="proceed only when"
            value={stage.proceedOnlyWhen}
            onChange={(proceedOnlyWhen) =>
              onChange({
                ...s,
                stages: s.stages.map((v) =>
                  v.id === stage.id ? { ...v, proceedOnlyWhen } : v,
                ),
              })
            }
          />
        </Module>
      ))}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange({
            ...s,
            stages: [
              ...s.stages,
              {
                id: identity(),
                directions: "",
                minimumDaysFromActualStart: null,
                proceedOnlyWhen: "",
              },
            ],
          })
        }
      >
        add introduction stage
      </EditButton>
      <p className="advisor-muted">
        stages stay anchored to actual start and comfort. they never advance
        automatically.
      </p>
    </div>
  );
}
export function SourceFields({
  value,
  onChange,
}: {
  value: Source[];
  onChange: (v: Source[]) => void;
}) {
  return (
    <div className="advisor-fields">
      {value.map((source, index) => (
        <Module
          key={index}
          title={`public source ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <TextField
            label="source label"
            value={source.label}
            onChange={(label) =>
              onChange(value.map((v, i) => (i === index ? { ...v, label } : v)))
            }
          />
          <TextField
            label="public source URL"
            value={source.url}
            onChange={(url) =>
              onChange(value.map((v, i) => (i === index ? { ...v, url } : v)))
            }
          />
        </Module>
      ))}
      <EditButton
        variant="secondary"
        onClick={() => onChange([...value, { label: "", url: "" }])}
      >
        add public citation
      </EditButton>
    </div>
  );
}
function EvidenceFields({
  value,
  onChange,
}: {
  value: Fact[];
  onChange: (v: Fact[]) => void;
}) {
  return (
    <>
      {value.map((fact, index) => (
        <Module
          key={index}
          title={`evidence ${index + 1}`}
          onRemove={() => onChange(value.filter((_, i) => i !== index))}
        >
          <TextField
            label="evidence title"
            value={fact.title}
            onChange={(title) =>
              onChange(value.map((v, i) => (i === index ? { ...v, title } : v)))
            }
          />
          <TextField
            label="evidence and limitations"
            long
            value={fact.body}
            onChange={(body) =>
              onChange(value.map((v, i) => (i === index ? { ...v, body } : v)))
            }
          />
          <SourceFields
            value={fact.sources}
            onChange={(sources) =>
              onChange(
                value.map((v, i) => (i === index ? { ...v, sources } : v)),
              )
            }
          />
        </Module>
      ))}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange([
            ...value,
            { title: "", body: "", ingredientGuideKey: null, sources: [] },
          ])
        }
      >
        add evidence
      </EditButton>
    </>
  );
}
function GuideFields({
  value,
  onChange,
  productId = null,
  max = 50,
}: {
  value: Guide[];
  onChange: (v: Guide[]) => void;
  productId?: string | null;
  max?: number;
}) {
  return (
    <>
      {value.map((guide, index) => {
        const patch = (p: Partial<Guide>) =>
          onChange(value.map((v, i) => (i === index ? { ...v, ...p } : v)));
        return (
          <Module
            key={guide.id}
            title={`guide ${index + 1}`}
            onRemove={() => onChange(value.filter((v) => v.id !== guide.id))}
          >
            <TextField
              label="guide title"
              value={guide.title}
              onChange={(title) => patch({ title })}
            />
            <TextField
              label="guide introduction"
              long
              value={guide.intro}
              onChange={(intro) => patch({ intro })}
            />
            {guide.steps.map((step, i) => (
              <div className="advisor-fields" key={i}>
                <TextField
                  label={`guide step ${i + 1} title`}
                  value={step.title ?? ""}
                  onChange={(title) =>
                    patch({
                      steps: guide.steps.map((v, j) =>
                        i === j ? { ...v, title: title || null } : v,
                      ),
                    })
                  }
                />
                <TextField
                  label={`guide step ${i + 1}`}
                  long
                  value={step.body}
                  onChange={(body) =>
                    patch({
                      steps: guide.steps.map((v, j) =>
                        i === j ? { ...v, body } : v,
                      ),
                    })
                  }
                />
                <EditButton
                  variant="ghost"
                  onClick={() =>
                    patch({ steps: guide.steps.filter((_, j) => i !== j) })
                  }
                >
                  remove guide step
                </EditButton>
              </div>
            ))}
            <EditButton
              variant="secondary"
              onClick={() =>
                patch({ steps: [...guide.steps, { title: null, body: "" }] })
              }
            >
              add guide step
            </EditButton>
            <TextField
              label="care note"
              long
              value={guide.careNote ?? ""}
              onChange={(careNote) => patch({ careNote: careNote || null })}
            />
            <SourceFields
              value={guide.sources}
              onChange={(sources) => patch({ sources })}
            />
          </Module>
        );
      })}
      {value.length < max ? (
        <EditButton
          variant="secondary"
          onClick={() =>
            onChange([
              ...value,
              {
                id: identity(),
                productId,
                title: "",
                intro: "",
                steps: [],
                careNote: null,
                sources: [],
              },
            ])
          }
        >
          add guide
        </EditButton>
      ) : null}
    </>
  );
}
function KnownField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Known<string>;
  onChange: (v: Known<string>) => void;
}) {
  return (
    <div className="advisor-fields">
      <Choice
        label={`${label} status`}
        value={value.state}
        values={["unknown", "known"]}
        onChange={(state) =>
          onChange(state === "unknown" ? { state } : { state, value: "" })
        }
      />
      {value.state === "known" ? (
        <TextField
          label={label}
          value={value.value}
          onChange={(v) => onChange({ state: "known", value: v })}
        />
      ) : null}
    </div>
  );
}
function ProductSelect({
  label,
  value,
  content,
  onChange,
}: {
  label: string;
  value: string | null;
  content: PlanContent;
  onChange: (v: string | null) => void;
}) {
  const disabled = useContext(MutationDisabled);
  return (
    <Field label={label}>
      <Select
        disabled={disabled}
        value={value ?? "__none"}
        options={[
          { value: "__none", label: "no product" },
          ...content.products.map((p) => ({
            value: p.id,
            label: `${p.name || "unnamed product"} · ${p.id.slice(0, 8)}`,
          })),
        ]}
        onValueChange={(v) => onChange(v === "__none" ? null : v)}
      />
    </Field>
  );
}
function References({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: { id: string; label: string }[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <p className="advisor-label">{label}</p>
      <div className="advisor-actions">
        {options.length ? (
          options.map((v) => (
            <EditButton
              key={v.id}
              variant="secondary"
              aria-pressed={values.includes(v.id)}
              onClick={() =>
                onChange(
                  values.includes(v.id)
                    ? values.filter((id) => id !== v.id)
                    : [...values, v.id],
                )
              }
            >
              {v.label || "unnamed"} · {v.id.slice(0, 8)}
            </EditButton>
          ))
        ) : (
          <p className="advisor-muted">none recorded</p>
        )}
      </div>
    </div>
  );
}

export function ContextFields({
  content: c,
  onChange,
}: {
  content: PlanContent;
  onChange: (v: PlanContent) => void;
}) {
  return (
    <>
      <TextField
        label="plan title"
        value={c.title}
        onChange={(title) => onChange({ ...c, title })}
      />
      <TextField
        label="summary"
        long
        value={c.summary}
        onChange={(summary) => onChange({ ...c, summary })}
      />
      <Choice
        label="current products"
        value={c.context.products.state}
        values={["unknown", "none", "recorded"]}
        onChange={(state) => {
          if (state === "unknown")
            onChange({ ...c, context: { ...c.context, products: { state } } });
          else if (state === "recorded")
            onChange({
              ...c,
              context: { ...c.context, products: { state, productIds: [] } },
            });
          else {
            const id = identity();
            onChange({
              ...c,
              context: {
                products: { state, factId: id },
                facts: [
                  ...c.context.facts,
                  {
                    id,
                    kind: "client_report",
                    visibility: "advisor_only",
                    text: "",
                    sources: [],
                    contradicts: [],
                  },
                ],
              },
            });
          }
        }}
      />
      {c.context.products.state === "recorded" ? (
        <References
          label="reported current products"
          values={c.context.products.productIds}
          options={c.products.map((p) => ({ id: p.id, label: p.name }))}
          onChange={(productIds) =>
            onChange({
              ...c,
              context: {
                ...c.context,
                products: { state: "recorded", productIds },
              },
            })
          }
        />
      ) : null}
      {c.context.products.state === "none" ? (
        <p className="advisor-muted">
          record the basis for confirmed none in sources; unknown is a separate
          state.
        </p>
      ) : null}
      <h3>goals</h3>
      {c.goals.map((goal) => (
        <Module
          key={goal.id}
          title="goal"
          onRemove={() =>
            onChange({ ...c, goals: c.goals.filter((v) => v.id !== goal.id) })
          }
          disabled={c.decisions.some((d) => d.goalIds.includes(goal.id))}
        >
          <TextField
            label="goal"
            long
            value={goal.text}
            onChange={(text) =>
              onChange({
                ...c,
                goals: c.goals.map((v) =>
                  v.id === goal.id ? { ...v, text } : v,
                ),
              })
            }
          />
        </Module>
      ))}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange({
            ...c,
            goals: [...c.goals, { id: identity(), text: "", factIds: [] }],
          })
        }
      >
        add goal
      </EditButton>
      <h3>products</h3>
      {c.products.map((product, index) => {
        const patch = (p: Partial<PlanProduct>) =>
            onChange({
              ...c,
              products: c.products.map((v) =>
                v.id === product.id ? { ...v, ...p } : v,
              ),
            }),
          used =
            c.routine.some((s) => s.productId === product.id) ||
            c.decisions.some((d) =>
              [
                d.primaryProductId,
                ...d.currentProductIds,
                ...d.alternativeProductIds,
              ].includes(product.id),
            ) ||
            (c.context.products.state === "recorded" &&
              c.context.products.productIds.includes(product.id));
        return (
          <Module
            key={product.id}
            title={`product ${index + 1}`}
            disabled={used}
            onRemove={() =>
              onChange({
                ...c,
                products: c.products.filter((v) => v.id !== product.id),
              })
            }
          >
            <p className="advisor-muted">{product.id}</p>
            <TextField
              label="product name"
              value={product.name}
              onChange={(name) => patch({ name })}
            />
            <div className="advisor-pair">
              <TextField
                label="brand"
                value={product.brand ?? ""}
                onChange={(brand) => patch({ brand: brand || null })}
              />
              <TextField
                label="variant"
                value={product.variant ?? ""}
                onChange={(variant) => patch({ variant: variant || null })}
              />
            </div>
            <TextField
              label="size"
              value={product.sizeLabel}
              onChange={(sizeLabel) => patch({ sizeLabel })}
            />
            <KnownField
              label="strength"
              value={product.strength}
              onChange={(strength) => patch({ strength })}
            />
            <KnownField
              label="category"
              value={product.category}
              onChange={(category) => patch({ category })}
            />
            <Choice
              label="product identity"
              value={product.identity}
              values={["unresolved", "possible_match", "client_confirmed"]}
              onChange={(identity) => patch({ identity })}
            />
            <Choice
              label="formula"
              value={product.formula}
              values={["unknown", "label_recorded", "verified"]}
              onChange={(formula) => patch({ formula })}
            />
            <TextField
              label="product URL"
              value={product.productUrl ?? ""}
              onChange={(productUrl) =>
                patch({ productUrl: productUrl || null })
              }
            />
            <TextField
              label="public image URL"
              value={product.imageUrl ?? ""}
              onChange={(imageUrl) => patch({ imageUrl: imageUrl || null })}
            />
            <TextField
              label="product source reference"
              value={product.reference ?? ""}
              onChange={(reference) => patch({ reference: reference || null })}
            />
            <Disclosure title="directions, evidence & public sources">
              <div className="advisor-fields">
                <GuideFields
                  productId={product.id}
                  value={product.guides}
                  onChange={(guides) => patch({ guides })}
                />
                <EvidenceFields
                  value={product.evidence}
                  onChange={(evidence) => patch({ evidence })}
                />
              </div>
            </Disclosure>
          </Module>
        );
      })}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange({
            ...c,
            products: [
              ...c.products,
              {
                id: identity(),
                name: "",
                brand: null,
                variant: null,
                sizeLabel: "",
                productUrl: null,
                imageUrl: null,
                reference: null,
                displayPrice: null,
                strength: { state: "unknown" },
                category: { state: "unknown" },
                identity: "unresolved",
                formula: "unknown",
                factIds: [],
                guides: [],
                evidence: [],
              },
            ],
          })
        }
      >
        add product
      </EditButton>
      <Disclosure title="consultation conclusions">
        <div className="advisor-fields">
          {c.consultationSections.map((s, i) => (
            <Module
              key={i}
              title={`conclusion ${i + 1}`}
              onRemove={() =>
                onChange({
                  ...c,
                  consultationSections: c.consultationSections.filter(
                    (_, j) => i !== j,
                  ),
                })
              }
            >
              <TextField
                label="conclusion title"
                value={s.title}
                onChange={(title) =>
                  onChange({
                    ...c,
                    consultationSections: c.consultationSections.map((v, j) =>
                      i === j ? { ...v, title } : v,
                    ),
                  })
                }
              />
              <TextField
                label="conclusion"
                long
                value={s.body}
                onChange={(body) =>
                  onChange({
                    ...c,
                    consultationSections: c.consultationSections.map((v, j) =>
                      i === j ? { ...v, body } : v,
                    ),
                  })
                }
              />
            </Module>
          ))}
          <EditButton
            variant="secondary"
            onClick={() =>
              onChange({
                ...c,
                consultationSections: [
                  ...c.consultationSections,
                  { title: "", body: "" },
                ],
              })
            }
          >
            add conclusion
          </EditButton>
        </div>
      </Disclosure>
    </>
  );
}
export function SourcesFields({
  content: c,
  onChange,
}: {
  content: PlanContent;
  onChange: (v: PlanContent) => void;
}) {
  return (
    <>
      <p className="advisor-muted">
        private source locations stay with advisor facts. only facts marked
        client-visible enter the client preview.
      </p>
      {c.context.facts.map((fact, index) => {
        const patch = (p: Partial<ProvenanceFact>) =>
          onChange({
            ...c,
            context: {
              ...c.context,
              facts: c.context.facts.map((v) =>
                v.id === fact.id ? { ...v, ...p } : v,
              ),
            },
          });
        const used =
          c.goals.some((g) => g.factIds.includes(fact.id)) ||
          c.products.some((p) => p.factIds.includes(fact.id)) ||
          c.decisions.some((d) => d.factIds.includes(fact.id)) ||
          c.context.facts.some((f) => f.contradicts.includes(fact.id)) ||
          (c.context.products.state === "none" &&
            c.context.products.factId === fact.id);
        return (
          <Module
            key={fact.id}
            title={`fact ${index + 1}`}
            disabled={used}
            onRemove={() =>
              onChange({
                ...c,
                context: {
                  ...c.context,
                  facts: c.context.facts.filter((v) => v.id !== fact.id),
                },
              })
            }
          >
            <Choice
              label="fact type"
              value={fact.kind}
              values={["client_report", "advisor_conclusion", "agent_proposal"]}
              onChange={(kind) => patch({ kind })}
            />
            <Choice
              label="fact visibility"
              value={fact.visibility}
              values={["advisor_only", "client"]}
              onChange={(visibility) => patch({ visibility })}
            />
            <TextField
              label="fact or uncertainty"
              long
              value={fact.text}
              onChange={(text) => patch({ text })}
            />
            <References
              label="unresolved contradictions"
              values={fact.contradicts}
              options={c.context.facts
                .filter((f) => f.id !== fact.id)
                .map((f) => ({ id: f.id, label: f.text }))}
              onChange={(contradicts) => patch({ contradicts })}
            />
            {fact.sources.length ? (
              <Disclosure title="retained private source locations">
                {fact.sources.map((s, i) => (
                  <p key={i}>
                    {s.sourceId} · version {s.sourceVersion} ·{" "}
                    {JSON.stringify(s.locator)}
                  </p>
                ))}
              </Disclosure>
            ) : (
              <p className="advisor-muted">no source location recorded</p>
            )}
          </Module>
        );
      })}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange({
            ...c,
            context: {
              ...c.context,
              facts: [
                ...c.context.facts,
                {
                  id: identity(),
                  kind: "advisor_conclusion",
                  visibility: "advisor_only",
                  text: "",
                  sources: [],
                  contradicts: [],
                },
              ],
            },
          })
        }
      >
        add fact
      </EditButton>
      <h3>public sources</h3>
      <SourceFields
        value={c.sources}
        onChange={(sources) => onChange({ ...c, sources })}
      />
    </>
  );
}
function ComparisonFields({
  value,
  onChange,
}: {
  value: Comparison[];
  onChange: (v: Comparison[]) => void;
}) {
  return (
    <>
      {value.map((c, i) => {
        const patch = (p: Partial<Comparison>) =>
          onChange(value.map((v, j) => (i === j ? { ...v, ...p } : v)));
        return (
          <Module
            key={i}
            title={`comparison ${i + 1}`}
            onRemove={() => onChange(value.filter((_, j) => i !== j))}
          >
            <TextField
              label="comparison label"
              value={c.label}
              onChange={(label) => patch({ label })}
            />
            <TextField
              label="current context"
              long
              value={c.currentText}
              onChange={(currentText) => patch({ currentText })}
            />
            <TextField
              label="proposed context"
              long
              value={c.proposedText}
              onChange={(proposedText) => patch({ proposedText })}
            />
            <TextField
              label="comparison significance & limits"
              long
              value={c.significance}
              onChange={(significance) => patch({ significance })}
            />
            <SourceFields
              value={c.sources}
              onChange={(sources) => patch({ sources })}
            />
          </Module>
        );
      })}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange([
            ...value,
            {
              label: "",
              currentText: "",
              proposedText: "",
              significance: "",
              ingredientGuideKey: null,
              guideNote: null,
              sources: [],
            },
          ])
        }
      >
        add comparison
      </EditButton>
    </>
  );
}
export function DecisionsFields({
  content: c,
  onChange,
}: {
  content: PlanContent;
  onChange: (v: PlanContent) => void;
}) {
  return (
    <>
      {c.decisions.map((decision, index) => {
        const patch = (p: Partial<PlanDecision>) =>
          onChange({
            ...c,
            decisions: c.decisions.map((v) =>
              v.id === decision.id ? { ...v, ...p } : v,
            ),
          });
        return (
          <Module
            key={decision.id}
            title={`recommendation ${index + 1}`}
            onRemove={() =>
              onChange({
                ...c,
                decisions: c.decisions.filter((v) => v.id !== decision.id),
              })
            }
          >
            <div className="advisor-pair">
              <Choice
                label="action"
                value={decision.kind}
                values={decisionKinds}
                onChange={(kind) => patch({ kind })}
              />
              <ProductSelect
                label="product"
                value={decision.primaryProductId}
                content={c}
                onChange={(primaryProductId) => patch({ primaryProductId })}
              />
            </div>
            <TextField
              label="routine slot"
              value={decision.slotId}
              onChange={(slotId) => patch({ slotId })}
            />
            <TextField
              label="why this fits"
              long
              value={decision.reason}
              onChange={(reason) => patch({ reason })}
            />
            <Lines
              label="directions"
              value={decision.directions}
              onChange={(directions) => patch({ directions })}
            />
            <Lines
              label="cautions"
              value={decision.cautions}
              onChange={(cautions) => patch({ cautions })}
            />
            <Lines
              label="evidence & limits"
              value={decision.limitations}
              onChange={(limitations) => patch({ limitations })}
            />
            <References
              label="goals for this decision"
              values={decision.goalIds}
              options={c.goals.map((g) => ({ id: g.id, label: g.text }))}
              onChange={(goalIds) => patch({ goalIds })}
            />
            <References
              label="current products for this decision"
              values={decision.currentProductIds}
              options={c.products.map((p) => ({ id: p.id, label: p.name }))}
              onChange={(currentProductIds) => patch({ currentProductIds })}
            />
            <References
              label="optional alternatives"
              values={decision.alternativeProductIds}
              options={c.products.map((p) => ({ id: p.id, label: p.name }))}
              onChange={(alternativeProductIds) =>
                patch({ alternativeProductIds })
              }
            />
            <Choice
              label="authored schedule"
              value={decision.schedule ? "recorded" : "none"}
              values={["none", "recorded"]}
              onChange={(v) =>
                patch({ schedule: v === "none" ? null : emptySchedule() })
              }
            />
            {decision.schedule ? (
              <ScheduleFields
                value={decision.schedule}
                onChange={(schedule) => patch({ schedule })}
              />
            ) : null}
            <Disclosure title="client explanation, guides & evidence">
              <div className="advisor-fields">
                <TextField
                  label="client decision title"
                  value={decision.guidance.title}
                  onChange={(title) =>
                    patch({ guidance: { ...decision.guidance, title } })
                  }
                />
                <TextField
                  label="client decision subtitle"
                  value={decision.guidance.subtitle}
                  onChange={(subtitle) =>
                    patch({ guidance: { ...decision.guidance, subtitle } })
                  }
                />
                <GuideFields
                  max={1}
                  productId={decision.primaryProductId}
                  value={decision.guidance.how ? [decision.guidance.how] : []}
                  onChange={(guides) =>
                    patch({
                      guidance: {
                        ...decision.guidance,
                        how: guides.at(-1) ?? null,
                      },
                    })
                  }
                />
                <EvidenceFields
                  value={decision.guidance.facts}
                  onChange={(facts) =>
                    patch({ guidance: { ...decision.guidance, facts } })
                  }
                />
                <ComparisonFields
                  value={decision.guidance.comparisons}
                  onChange={(comparisons) =>
                    patch({ guidance: { ...decision.guidance, comparisons } })
                  }
                />
                <SourceFields
                  value={decision.guidance.sources}
                  onChange={(sources) =>
                    patch({ guidance: { ...decision.guidance, sources } })
                  }
                />
              </div>
            </Disclosure>
          </Module>
        );
      })}
      <EditButton
        variant="secondary"
        onClick={() => {
          const id = identity();
          onChange({
            ...c,
            decisions: [
              ...c.decisions,
              {
                id,
                slotId: id,
                recommendationId: null,
                kind: "no_addition",
                goalIds: [],
                currentProductIds: [],
                primaryProductId: null,
                alternativeProductIds: [],
                reason: "",
                directions: [],
                cautions: [],
                limitations: [],
                schedule: null,
                factIds: [],
                guidance: {
                  title: "",
                  subtitle: "",
                  rationaleTitle: "",
                  reasons: [],
                  actions: [],
                  comparisons: [],
                  factsTitle: "",
                  facts: [],
                  how: null,
                  sources: [],
                  group: null,
                  decisionLabels: null,
                },
              },
            ],
          });
        }}
      >
        add decision
      </EditButton>
    </>
  );
}
export function RoutineFields({
  content: c,
  onChange,
}: {
  content: PlanContent;
  onChange: (v: PlanContent) => void;
}) {
  return (
    <>
      {c.routine.map((step, index) => {
        const patch = (p: Partial<RoutineStep>) =>
          onChange({
            ...c,
            routine: c.routine.map((v) =>
              v.id === step.id ? { ...v, ...p } : v,
            ),
          });
        return (
          <Module
            key={step.id}
            title={`routine step ${index + 1}`}
            onRemove={() =>
              onChange({
                ...c,
                routine: c.routine.filter((v) => v.id !== step.id),
              })
            }
          >
            <TextField
              label="routine slot"
              value={step.slotId}
              onChange={(slotId) => patch({ slotId })}
            />
            <TextField
              label="step title"
              value={step.title}
              onChange={(title) => patch({ title })}
            />
            <ProductSelect
              label="step product"
              value={step.productId}
              content={c}
              onChange={(productId) =>
                patch({
                  productId,
                  kind: productId ? "product" : "instruction",
                })
              }
            />
            <Lines
              label="directions"
              value={step.directions}
              onChange={(directions) => patch({ directions })}
            />
            <Lines
              label="cautions"
              value={step.cautions}
              onChange={(cautions) => patch({ cautions })}
            />
            <ScheduleFields
              value={step.schedule}
              onChange={(schedule) => patch({ schedule })}
            />
          </Module>
        );
      })}
      <EditButton
        variant="secondary"
        onClick={() => {
          const id = identity();
          onChange({
            ...c,
            routine: [
              ...c.routine,
              {
                id,
                slotId: id,
                kind: "instruction",
                productId: null,
                title: "",
                directions: [],
                cautions: [],
                schedule: emptySchedule(),
              },
            ],
          });
        }}
      >
        add routine step
      </EditButton>
      <Disclosure title="complete routine guides">
        <div className="advisor-fields">
          <GuideFields
            value={c.routineGuides}
            onChange={(routineGuides) => onChange({ ...c, routineGuides })}
          />
        </div>
      </Disclosure>
    </>
  );
}
export function FollowUpFields({
  content: c,
  onChange,
}: {
  content: PlanContent;
  onChange: (v: PlanContent) => void;
}) {
  return (
    <>
      {c.followUp.criteria.map((criterion, i) => (
        <Module
          key={i}
          title={`criterion ${i + 1}`}
          onRemove={() =>
            onChange({
              ...c,
              followUp: {
                ...c.followUp,
                criteria: c.followUp.criteria.filter((_, j) => j !== i),
              },
            })
          }
        >
          <TextField
            label={`criterion ${i + 1}`}
            long
            value={criterion}
            onChange={(text) =>
              onChange({
                ...c,
                followUp: {
                  ...c.followUp,
                  criteria: c.followUp.criteria.map((v, j) =>
                    j === i ? text : v,
                  ),
                },
              })
            }
          />
        </Module>
      ))}
      <EditButton
        variant="secondary"
        onClick={() =>
          onChange({
            ...c,
            followUp: { ...c.followUp, criteria: [...c.followUp.criteria, ""] },
          })
        }
      >
        add follow-up criterion
      </EditButton>
      <Lines
        label="follow-up guidance"
        value={c.followUp.authoredNotes}
        onChange={(authoredNotes) =>
          onChange({ ...c, followUp: { ...c.followUp, authoredNotes } })
        }
      />
    </>
  );
}
