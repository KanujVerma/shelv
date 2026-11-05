import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "../../../ui/index.ts";
import type {
  ConversationBody,
  ConversationFactRef,
} from "../../../../../../src/contracts/PortalReview.ts";
import type { ClientPublicationRef } from "../../../../../../src/contracts/PortalCare.ts";
import type { AdvisorGuidanceController } from "./controller.ts";
export function ConversationComposer({
  controller,
  publication,
  disabled,
}: {
  controller: AdvisorGuidanceController;
  publication: ClientPublicationRef;
  disabled: boolean;
}) {
  const [body, setBody] = useState<
    Omit<ConversationBody, "channel"> & {
      channel: ConversationBody["channel"] | "";
    }
  >(() => ({
    publication,
    channel: "",
    occurredOn: { state: "unknown" },
    clientReported: [],
    advisorConclusions: [],
    agentProposals: [],
    contradictions: [],
  }));
  const [confirmed, setConfirmed] = useState(false);
  const total =
    body.clientReported.length +
    body.advisorConclusions.length +
    body.agentProposals.length;
  const factOptions = [
    ...body.clientReported.map((f) => ({
      kind: "client_report" as const,
      id: f.id,
      text: f.text,
    })),
    ...body.advisorConclusions.map((f) => ({
      kind: "advisor_conclusion" as const,
      id: f.id,
      text: f.text,
    })),
    ...body.agentProposals.map((f) => ({
      kind: "agent_proposal" as const,
      id: f.id,
      text: f.text,
    })),
  ];
  const ref = (value: string): ConversationFactRef => {
    const f = factOptions.find((f) => `${f.kind}:${f.id}` === value)!;
    return { kind: f.kind, id: f.id };
  };
  return (
    <section
      className="advisor-guidance-fields"
      aria-label="record an actual conversation"
    >
      <h2>record a conversation</h2>
      <p>
        record what was actually said. private preparation and published
        guidance are separate.
      </p>
      <Field label="actual channel">
        <Select
          value={body.channel}
          disabled={disabled}
          placeholder="select the actual channel"
          options={["text", "call", "video", "in_person"].map((value) => ({
            value,
            label: value.replaceAll("_", " "),
          }))}
          onValueChange={(value) =>
            setBody({ ...body, channel: value as ConversationBody["channel"] })
          }
        />
      </Field>
      <Field label="actual date" hint="leave empty if the date is unknown">
        <Input
          type="date"
          disabled={disabled}
          value={body.occurredOn.state === "known" ? body.occurredOn.value : ""}
          onChange={(e) =>
            setBody({
              ...body,
              occurredOn: e.target.value
                ? { state: "known", value: e.target.value }
                : { state: "unknown" },
            })
          }
        />
      </Field>
      {(
        ["clientReported", "advisorConclusions", "agentProposals"] as const
      ).map((bucket) => (
        <section key={bucket} className="advisor-guidance-fields">
          <h3>
            {bucket === "clientReported"
              ? "client-reported facts"
              : bucket === "advisorConclusions"
                ? "advisor conclusions"
                : "agent proposals"}
          </h3>
          {body[bucket].map((fact, index) => (
            <div key={fact.id} className="advisor-guidance-fields">
              <Field label={`fact ${index + 1}`}>
                <Textarea
                  disabled={disabled}
                  value={fact.text}
                  onChange={(e) =>
                    setBody({
                      ...body,
                      [bucket]: body[bucket].map((f) =>
                        f.id === fact.id ? { ...f, text: e.target.value } : f,
                      ),
                    })
                  }
                />
              </Field>
              {"proposedBy" in fact ? (
                <p>
                  proposal author:{" "}
                  {fact.proposedBy.state === "known"
                    ? fact.proposedBy.value
                    : "not recorded"}
                </p>
              ) : null}
              <Button
                variant="ghost"
                disabled={disabled}
                onClick={() =>
                  setBody({
                    ...body,
                    [bucket]: body[bucket].filter((f) => f.id !== fact.id),
                    contradictions: body.contradictions.filter(
                      (c) => c.left.id !== fact.id && c.right.id !== fact.id,
                    ),
                  })
                }
              >
                remove fact {index + 1}
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            disabled={disabled || total >= 50}
            onClick={() => {
              const fact = { id: crypto.randomUUID(), text: "", sources: [] };
              setBody({
                ...body,
                [bucket]: [
                  ...body[bucket],
                  ...(bucket === "agentProposals"
                    ? [{ ...fact, proposedBy: { state: "unknown" } }]
                    : [fact]),
                ],
              });
            }}
          >
            add{" "}
            {bucket === "clientReported"
              ? "client report"
              : bucket === "advisorConclusions"
                ? "advisor conclusion"
                : "agent proposal"}
          </Button>
        </section>
      ))}
      <section className="advisor-guidance-fields">
        <h3>unresolved contradictions</h3>
        {body.contradictions.map((conflict, index) => (
          <div key={index} className="advisor-guidance-fields">
            {(["left", "right"] as const).map((side) => (
              <Field
                key={side}
                label={side === "left" ? "first fact" : "contradicting fact"}
              >
                <Select
                  disabled={disabled}
                  value={`${conflict[side].kind}:${conflict[side].id}`}
                  options={factOptions.map((f) => ({
                    value: `${f.kind}:${f.id}`,
                    label: `${f.kind.replaceAll("_", " ")}: ${f.text || f.id}`,
                  }))}
                  onValueChange={(value) =>
                    setBody({
                      ...body,
                      contradictions: body.contradictions.map((c, i) =>
                        i === index ? { ...c, [side]: ref(value) } : c,
                      ),
                    })
                  }
                />
              </Field>
            ))}
            <Field label="what remains unresolved">
              <Textarea
                disabled={disabled}
                value={conflict.note}
                onChange={(e) =>
                  setBody({
                    ...body,
                    contradictions: body.contradictions.map((c, i) =>
                      i === index ? { ...c, note: e.target.value } : c,
                    ),
                  })
                }
              />
            </Field>
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() =>
                setBody({
                  ...body,
                  contradictions: body.contradictions.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            >
              remove contradiction
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={
            disabled ||
            factOptions.length < 2 ||
            body.contradictions.length >= 100
          }
          onClick={() => {
            const left = factOptions[0]!,
              right = factOptions[1]!;
            setBody({
              ...body,
              contradictions: [
                ...body.contradictions,
                {
                  left: { kind: left.kind, id: left.id },
                  right: { kind: right.kind, id: right.id },
                  note: "",
                },
              ],
            });
          }}
        >
          add contradiction
        </Button>
      </section>
      <p>
        source attachment and photo upload are unavailable. no photo or goal
        answer is required.
      </p>
      <label>
        <input
          type="checkbox"
          disabled={disabled}
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        these facts reflect the actual conversation
      </label>
      <Button
        disabled={disabled || !confirmed || !body.channel || total === 0}
        onClick={() => {
          if (body.channel)
            void controller.recordConversation({
              ...body,
              channel: body.channel,
            });
        }}
      >
        record conversation
      </Button>
    </section>
  );
}
