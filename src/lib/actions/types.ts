/** Shape returned by every form action. Messages are keys, translated on the client. */
export type ActionState = {
  ok?: boolean;
  /** Form-level error key (see dict.auth.errors). */
  error?: string;
  /** Field-level error keys. */
  fieldErrors?: Record<string, string>;
  /** Echoed values (never passwords) so the form keeps what the user typed. */
  values?: Record<string, string>;
  /** Extra data for success screens. */
  email?: string;
  reference?: string;
};
