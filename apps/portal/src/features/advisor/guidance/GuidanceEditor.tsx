import { Button, Field, Input, Textarea, Select } from "../../../ui/index.ts";
import type { GuidanceBody } from "../../../../../../src/contracts/PortalReview.ts";
import type { Schedule } from "../../../../../../src/contracts/PortalRebuild.ts";
const lines = (s: string) => (s === "" ? [] : s.split("\n"));
export function GuidanceBodyEditor({
  body,
  disabled,
  onChange,
}: {
  body: GuidanceBody;
  disabled: boolean;
  onChange(body: GuidanceBody): void;
}) {
  const text = (
    label: string,
    value: string,
    update: (value: string) => GuidanceBody,
    hint?: string,
  ) => (
    <Field label={label} hint={hint}>
      <Textarea
        value={value}
        readOnly={disabled}
        onChange={(e) => onChange(update(e.target.value))}
      />
    </Field>
  );
  if (body.kind === "review")
    return (
      <div className="advisor-guidance-fields">
        {text(
          "client reported",
          body.clientReport,
          (value) => ({ ...body, clientReport: value }),
          "only the report you intend to publish",
        )}
        {text("decision", body.conclusion, (value) => ({
          ...body,
          conclusion: value,
        }))}
        {text("why", body.rationale, (value) => ({
          ...body,
          rationale: value,
        }))}
        {text(
          "changes",
          body.changes.join("\n"),
          (value) => ({ ...body, changes: lines(value) }),
          "one change per line; leave empty for no changes",
        )}
        {text("next step", body.nextStep, (value) => ({
          ...body,
          nextStep: value,
        }))}
        <Field label="next review">
          <Input
            type="date"
            value={body.nextReviewOn ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...body, nextReviewOn: e.target.value || null })
            }
          />
        </Field>
        <Field
          label="conversation date"
          hint="leave empty when the actual date is unknown"
        >
          <Input
            type="date"
            value={
              body.occurredOn.state === "known" ? body.occurredOn.value : ""
            }
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...body,
                occurredOn: e.target.value
                  ? { state: "known", value: e.target.value }
                  : { state: "unknown" },
              })
            }
          />
        </Field>
        <Field label="channel">
          <Select
            value={body.channel}
            disabled={disabled}
            onValueChange={(value) =>
              onChange({ ...body, channel: value as typeof body.channel })
            }
            options={["portal", "text", "call", "video", "in_person"].map(
              (value) => ({ value, label: value.replaceAll("_", " ") }),
            )}
          />
        </Field>
      </div>
    );
  if (body.kind === "reply")
    return (
      <div className="advisor-guidance-fields">
        <p>
          reply to {body.reportRef.kind.replaceAll("_", " ")} ·{" "}
          {body.reportRef.id}
        </p>
        {text("client-visible reply", body.reply, (value) => ({
          ...body,
          reply: value,
        }))}
        {text("next step", body.nextStep ?? "", (value) => ({
          ...body,
          nextStep: value || null,
        }))}
      </div>
    );
  const schedule = (next: Schedule) => onChange({ ...body, schedule: next });
  return (
    <div className="advisor-guidance-fields">
      <p>
        instruction for {body.slotId} · {body.productId ?? "nonproduct step"} ·
        base revision {body.baseInstructionVersion}
      </p>
      {text(
        "directions",
        body.directions.join("\n"),
        (value) => ({ ...body, directions: lines(value) }),
        "one direction per line",
      )}
      {text("cautions", body.cautions.join("\n"), (value) => ({
        ...body,
        cautions: lines(value),
      }))}
      {text("reason for this change", body.reason, (value) => ({
        ...body,
        reason: value,
      }))}
      <Field label="effective date">
        <Input
          type="date"
          value={body.effectiveOn}
          disabled={disabled}
          onChange={(e) => onChange({ ...body, effectiveOn: e.target.value })}
        />
      </Field>
      <fieldset disabled={disabled}>
        <legend>time of use</legend>
        <div className="advisor-guidance-actions">
          {(["morning", "evening"] as const).map((period) => (
            <label key={period}>
              <input
                type="checkbox"
                checked={body.schedule.periods.includes(period)}
                onChange={(e) =>
                  schedule({
                    ...body.schedule,
                    periods: e.target.checked
                      ? [...body.schedule.periods, period]
                      : body.schedule.periods.filter((p) => p !== period),
                  })
                }
              />
              {period}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="days">
        <Select
          value={body.schedule.days.kind}
          disabled={disabled}
          onValueChange={(value) =>
            schedule({
              ...body.schedule,
              days:
                value === "daily"
                  ? { kind: "daily" }
                  : { kind: "selected", weekdays: [] },
            })
          }
          options={[
            { value: "daily", label: "daily" },
            { value: "selected", label: "selected days" },
          ]}
        />
      </Field>
      {body.schedule.days.kind === "selected" ? (
        <fieldset disabled={disabled}>
          <legend>selected days</legend>
          <div className="advisor-guidance-actions">
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
            ).map((day, index) => {
              const value = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
              const days = body.schedule.days;
              return (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={
                      days.kind === "selected" && days.weekdays.includes(value)
                    }
                    onChange={(e) => {
                      if (days.kind === "selected")
                        schedule({
                          ...body.schedule,
                          days: {
                            kind: "selected",
                            weekdays: e.target.checked
                              ? [...days.weekdays, value]
                              : days.weekdays.filter((d) => d !== value),
                          },
                        });
                    }}
                  />
                  {day}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {text("use only when", body.schedule.condition ?? "", (value) => ({
        ...body,
        schedule: { ...body.schedule, condition: value || null },
      }))}
      <label>
        <input
          type="checkbox"
          disabled={disabled}
          checked={body.schedule.asNeeded}
          onChange={(e) =>
            schedule({ ...body.schedule, asNeeded: e.target.checked })
          }
        />
        as needed
      </label>
      <section
        className="advisor-guidance-fields"
        aria-label="authored introduction stages"
      >
        <h3>introduction stages</h3>
        <p>
          stages follow actual Start and comfort. they never advance
          automatically.
        </p>
        {body.schedule.stages.map((stage, index) => (
          <fieldset
            key={stage.id}
            disabled={disabled}
            className="advisor-guidance-stage"
          >
            <legend>
              stage {index + 1} · {stage.id}
            </legend>
            <Field label="stage directions">
              <Textarea
                value={stage.directions}
                onChange={(e) =>
                  schedule({
                    ...body.schedule,
                    stages: body.schedule.stages.map((s) =>
                      s.id === stage.id
                        ? { ...s, directions: e.target.value }
                        : s,
                    ),
                  })
                }
              />
            </Field>
            <Field
              label="minimum days from actual Start"
              hint="leave empty when no minimum is authored"
            >
              <Input
                type="number"
                min={0}
                value={stage.minimumDaysFromActualStart ?? ""}
                onChange={(e) =>
                  schedule({
                    ...body.schedule,
                    stages: body.schedule.stages.map((s) =>
                      s.id === stage.id
                        ? {
                            ...s,
                            minimumDaysFromActualStart:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }
                        : s,
                    ),
                  })
                }
              />
            </Field>
            <Field label="proceed only when">
              <Textarea
                value={stage.proceedOnlyWhen}
                onChange={(e) =>
                  schedule({
                    ...body.schedule,
                    stages: body.schedule.stages.map((s) =>
                      s.id === stage.id
                        ? { ...s, proceedOnlyWhen: e.target.value }
                        : s,
                    ),
                  })
                }
              />
            </Field>
            <Button
              variant="ghost"
              onClick={() =>
                schedule({
                  ...body.schedule,
                  stages: body.schedule.stages.filter((s) => s.id !== stage.id),
                })
              }
            >
              remove stage {index + 1}
            </Button>
          </fieldset>
        ))}
        <Button
          variant="secondary"
          disabled={disabled || body.schedule.stages.length >= 20}
          onClick={() =>
            schedule({
              ...body.schedule,
              stages: [
                ...body.schedule.stages,
                {
                  id: crypto.randomUUID(),
                  directions: "",
                  minimumDaysFromActualStart: null,
                  proceedOnlyWhen: "",
                },
              ],
            })
          }
        >
          add stage
        </Button>
      </section>
    </div>
  );
}
export function GuidanceBodyText({ body }: { body: GuidanceBody }) {
  const list = (values: string[]) =>
    values.length ? (
      <ul>
        {values.map((v, i) => (
          <li key={i}>{v || "empty value"}</li>
        ))}
      </ul>
    ) : (
      <p>none recorded</p>
    );
  return (
    <div className="advisor-guidance-fields">
      <p>
        publication {body.publication.version} · {body.kind}
      </p>
      {body.kind === "review" ? (
        <>
          <p>
            {body.channel.replaceAll("_", " ")} ·{" "}
            {body.occurredOn.state === "known"
              ? body.occurredOn.value
              : "occurred date not known"}
          </p>
          <h3>client reported</h3>
          <p>{body.clientReport || "not recorded"}</p>
          <h3>decision</h3>
          <p>{body.conclusion || "not recorded"}</p>
          <h3>why</h3>
          <p>{body.rationale || "not recorded"}</p>
          <h3>changes</h3>
          {list(body.changes)}
          <h3>next step</h3>
          <p>{body.nextStep || "not recorded"}</p>
          <p>next review: {body.nextReviewOn ?? "not set"}</p>
        </>
      ) : body.kind === "reply" ? (
        <>
          <p>report {body.reportRef.id}</p>
          <p>{body.reply || "not recorded"}</p>
          <p>{body.nextStep ?? "next step not recorded"}</p>
        </>
      ) : (
        <>
          <p>
            {body.slotId} · {body.productId ?? "nonproduct step"} · base{" "}
            {body.baseInstructionId ?? "none"} / revision{" "}
            {body.baseInstructionVersion}
          </p>
          <h3>directions</h3>
          {list(body.directions)}
          <h3>cautions</h3>
          {list(body.cautions)}
          <p>reason: {body.reason || "not recorded"}</p>
          <p>effective: {body.effectiveOn || "not set"}</p>
          <p>
            {body.schedule.periods.join(", ") || "time not set"} ·{" "}
            {body.schedule.days.kind === "daily"
              ? "daily"
              : `weekdays ${body.schedule.days.weekdays.join(", ")}`}{" "}
            · {body.schedule.asNeeded ? "as needed" : "scheduled"}
          </p>
          <p>condition: {body.schedule.condition ?? "none recorded"}</p>
          {body.schedule.stages.map((stage, index) => (
            <section key={stage.id}>
              <h3>
                stage {index + 1} · {stage.id}
              </h3>
              <p>{stage.directions || "directions not recorded"}</p>
              <p>
                minimum days from actual Start:{" "}
                {stage.minimumDaysFromActualStart ?? "not set"}
              </p>
              <p>
                proceed only when: {stage.proceedOnlyWhen || "not recorded"}
              </p>
            </section>
          ))}
          <p>
            Start basis:{" "}
            {body.useBasis
              ? `use revision ${body.useBasis.useRevision}; event ${body.useBasis.latestEventId ?? "none"}; correction ${body.useBasis.amendmentHeadId ?? "none"}`
              : "nonproduct instruction"}
          </p>
        </>
      )}
    </div>
  );
}
