/**
 * Shapes returned by the FastAPI backend.
 *
 * Draft based on the agreed data model — align field names with the backend
 * Pydantic schemas (or generate them from its OpenAPI spec) once they are final.
 */

export type Id = number;
export type ISODateString = string;

export type User = {
  id: Id;
  email: string;
  name: string;
  avatar_url: string | null;
};

export type IdeaCollection = {
  id: Id;
  name: string;
};

export type Idea = {
  id: Id;
  idea_collection_id: Id;
  title: string;
  description: string;
  category: string | null;
};

export type ContentType = "carousel" | "reel" | "story";

/** preview = generate and store without publishing; publish = generate and post. */
export type ProgramMode = "preview" | "publish";

export type Program = {
  id: Id;
  name: string;
  /** A program can exist without a collection: it is then inactive. */
  idea_collection_id: Id | null;
  /** Not returned by the backend yet: every program produces carousels. */
  content_type?: ContentType;
  /** Instagram account the program publishes to. */
  instagram_account_id: Id;
  /** Standard 5-field cron expression; parse it with `cronToSchedule` (lib/cron.ts). */
  cron_expression: string;
  /** IANA timezone the cron expression is evaluated in. */
  timezone: string;
  mode: ProgramMode;
  is_active: boolean;
  /** Managed by the scheduler. */
  last_run: ISODateString | null;
  next_run: ISODateString | null;
};

export type ContentStatus = "generated" | "publishing" | "published" | "failed";

export type Post = {
  id: Id;
  program_id: Id;
  idea_id: Id;
  caption: string;
  slides: Content[];
  status: ContentStatus;
  created_at: ISODateString;
  published_at: ISODateString | null;
};

export type ContentPost = {
  id: Id;
  status: ContentStatus;
  slides: Content[];
};

export type Content = {
  id: Id;
  position: number;
  storage_key: string;
  url: string;
};

export type LogLevel = "info" | "warning" | "error";

export type LogEntry = {
  id: Id;
  program_id: Id | null;
  level: LogLevel;
  message: string;
  created_at: ISODateString;
};

export type InstagramAccount = {
  id: Id;
  handle: string | null;
  updated_at: ISODateString | null;
};

export type InstagramOAuthLogin = {
  authorization_url: string;
};

// ---- Request payloads ----

export type CreateCollectionInput = {
  name: string;
};

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export type CreateIdeaInput = {
  idea_collection_id: Id;
  title: string;
  description: string;
  category?: string | null;
};

/** Partial update: only the fields sent are changed. */
export type UpdateIdeaInput = Partial<CreateIdeaInput>;

export type CreateProgramInput = {
  name: string;
  mode: ProgramMode;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  instagram_account_id: Id | null;
  idea_collection_id: Id | null;
  /*content_type: ContentType;*/
  /** Instagram account the program publishes to. Required when mode is "publish". */

  /** Standard 5-field cron expression, built with `scheduleToCron` (lib/cron.ts). */




};

/** Partial update: only the fields sent are changed. */
export type UpdateProgramInput = Partial<Omit<CreateProgramInput, "instagram_account_id">> & {
  instagram_account_id?: Id;
};
