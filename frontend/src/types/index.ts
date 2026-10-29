export type InputMode = 'DOMAIN_ONLY' | 'FIGMA_AND_DOCS' | 'HYBRID';

export type TestStatus = 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';

export type TestPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TestCategory =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'BOUNDARY'
  | 'UI'
  | 'FUNCTIONAL'
  | 'SECURITY_VALIDATION'
  | 'PERFORMANCE';

export interface TestStep {
  stepNo: number;
  action: 'GOTO' | 'FILL' | 'CLICK' | 'HOVER' | 'SELECT' | 'WAIT' | 'ASSERT_TEXT' | 'ASSERT_VISIBLE' | 'ASSERT_URL' | string;
  selector?: string;
  value?: string;
  assertion?: string;
  description?: string;
}

export interface TestCase {
  id: string;
  useCaseId: string;
  code: string;
  title: string;
  category: TestCategory | string;
  priority: TestPriority | string;
  preconditions?: string | null;
  steps: TestStep[];
  testData?: Record<string, unknown> | null;
  expectedResult: string;
  createdAt: string;
  executionItems?: TestExecutionItem[];
}

export interface UseCase {
  id: string;
  projectId: string;
  code: string;
  name: string;
  actor: string;
  description?: string | null;
  preconditions?: string | null;
  createdAt: string;
  testCases: TestCase[];
}

export interface InputSource {
  id: string;
  projectId: string;
  sourceType: 'FIGMA' | 'SRS_DOC' | 'DOM_CRAWL' | string;
  figmaUrl?: string | null;
  figmaNodeJson?: Record<string, unknown> | null;
  designImageUrl?: string | null;
  srsRawText?: string | null;
  domSnapshotJson?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TestExecutionItem {
  id: string;
  testRunId: string;
  testCaseId: string;
  testCase?: TestCase;
  status: TestStatus;
  actualResult?: string | null;
  errorLog?: string | null;
  screenshotUrl?: string | null;
  cloudinaryPublicId?: string | null;
  durationMs?: number | null;
  executedAt: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  runNumber: number;
  status: 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  pendingCases: number;
  reportXlsxUrl?: string | null;
  reportPdfUrl?: string | null;
  startedAt: string;
  completedAt?: string | null;
  executionItems?: TestExecutionItem[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  inputMode: InputMode;
  targetDomainUrl?: string | null;
  authConfig?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  inputSources?: InputSource[];
  useCases?: UseCase[];
  testRuns?: TestRun[];
  _count?: {
    useCases: number;
    testRuns: number;
  };
  latestRun?: TestRun | null;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  inputMode: InputMode;
  targetDomainUrl?: string;
  authConfig?: Record<string, unknown>;
}

export interface IngestFigmaPayload {
  figmaUrl: string;
  figmaToken?: string;
}

export interface IngestDomainPayload {
  url: string;
  authConfig?: Record<string, unknown>;
}

export interface GenerateScenariosPayload {
  customPrompt?: string;
  focusCategories?: string[];
}

export interface UpdateTestCasePayload {
  code?: string;
  title?: string;
  category?: string;
  priority?: string;
  preconditions?: string | null;
  steps?: TestStep[];
  testData?: Record<string, unknown> | null;
  expectedResult?: string;
}

export interface CreateTestCasePayload {
  code: string;
  title: string;
  category: string;
  priority: string;
  preconditions?: string;
  steps: TestStep[];
  testData?: Record<string, unknown>;
  expectedResult: string;
}

export interface UpdateExecutionItemPayload {
  status: TestStatus;
  actualResult?: string;
  errorLog?: string;
  screenshotUrl?: string;
}

export interface SSELogEvent {
  type: 'LOG' | 'STATUS_CHANGE' | 'STEP_START' | 'STEP_DONE' | 'ITEM_UPDATE' | 'RUN_COMPLETE' | 'RUN_ERROR';
  message: string;
  timestamp: string;
  runId: string;
  testCaseId?: string;
  status?: TestStatus;
  item?: Partial<TestExecutionItem>;
  summary?: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
}
