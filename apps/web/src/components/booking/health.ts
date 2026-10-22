// The health questionnaire for lab tests, after the seven general questions of the PAR-Q+ (2023).
// Texts: booking.health.questions.<key> in the message files.
// TODO(jaka): review the wording of the questions and the doctor note, in both languages, before launch.
export const healthQuestions = [
  "heart_condition",
  "chest_pain",
  "dizziness",
  "chronic_condition",
  "medication",
  "bone_joint",
  "supervised_only",
] as const;
export type HealthQuestion = (typeof healthQuestions)[number];

// Unanswered questions are left out; the form doesn't continue until all are answered.
export type HealthForm = Partial<Record<HealthQuestion, boolean>> & { other?: string };

export const healthComplete = (h: HealthForm) => healthQuestions.every((q) => typeof h[q] === "boolean");
export const anyYes = (h: HealthForm) => healthQuestions.some((q) => h[q] === true);

// What the api stores: every answer, plus the free text when there is any.
export function healthAnswers(h: HealthForm): Record<string, boolean | string> {
  const answers: Record<string, boolean | string> = Object.fromEntries(healthQuestions.map((q) => [q, h[q] === true]));
  const other = h.other?.trim();
  if (other) answers.other = other.slice(0, 500);
  return answers;
}

// Where a stored answer's label is under booking.health in the message files, for screens that show the answers
// (the coach's booking details). Undefined for a key this form never asks.
export function healthLabelKey(key: string) {
  if (key === "other") return "other";
  return (healthQuestions as readonly string[]).includes(key) ? `questions.${key}` : undefined;
}
