// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  profile: {
    avatar?: string;
    phone?: string;
    department?: string;
    bio?: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  skills: Skill[];
  workload: {
    current: number;
    maximum: number;
    averageResolutionTime: number;
  };
  statistics: {
    ticketsCreated: number;
    ticketsResolved: number;
    averageRating: number;
    totalRatings: number;
  };
  availability: {
    status: 'available' | 'busy' | 'away' | 'offline';
    workingHours: {
      start: string;
      end: string;
    };
    timezone: string;
    workingDays: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'business' | 'creative' | 'management' | 'other';
}

// Ticket Types
export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: TicketCategory;
  subcategory?: string;
  priority: TicketPriority;
  status: TicketStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  customer: User;
  assignedTo?: User;
  assignedBy?: User;
  assignedAt?: string;
  team: 'support' | 'technical' | 'billing' | 'sales' | 'product' | 'security';
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  sla: {
    responseTime: {
      target: number;
      actual?: number;
      breached: boolean;
    };
    resolutionTime: {
      target: number;
      actual?: number;
      breached: boolean;
    };
  };
  escalation: {
    level: number;
    escalatedAt?: string;
    escalatedBy?: User;
    escalatedTo?: User;
    reason?: string;
    history: EscalationHistory[];
  };
  aiAnalysis: {
    sentiment: {
      score: number;
      label:
        | 'very_negative'
        | 'negative'
        | 'neutral'
        | 'positive'
        | 'very_positive';
    };
    extractedKeywords: string[];
    suggestedCategory: TicketCategory;
    suggestedPriority: TicketPriority;
    confidence: {
      category: number;
      priority: number;
    };
    estimatedResolutionTime?: number;
    suggestedSkills: string[];
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
    suggestedResponse?: string;
    processedAt: string;
  };
  resolution?: {
    summary?: string;
    steps: string[];
    resolvedAt?: string;
    resolvedBy?: User;
    resolutionTime?: number;
    customerSatisfaction?: {
      rating: number;
      feedback?: string;
      ratedAt: string;
    };
  };
  source: {
    channel: 'email' | 'web' | 'api' | 'phone' | 'chat' | 'social';
    reference?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  history: TicketHistoryEntry[];
  watchers: Watcher[];
  relatedTickets: RelatedTicket[];
  metrics: {
    firstResponseTime?: number;
    reopenCount: number;
    escalationCount: number;
    commentCount: number;
    handoverCount: number;
  };
  dueDate?: string;
  customFields: CustomField[];
  isArchived: boolean;
  archivedAt?: string;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  ageInHours?: number;
  slaStatus?: 'met' | 'breached' | 'at_risk' | 'on_track';
  responseSlaStatus?: 'met' | 'breached' | 'at_risk' | 'pending';
  urgencyScore?: number;
}

export type TicketCategory =
  | 'technical'
  | 'billing'
  | 'account'
  | 'feature_request'
  | 'bug_report'
  | 'general_inquiry'
  | 'security'
  | 'integration'
  | 'performance'
  | 'data_issue'
  | 'ui_ux'
  | 'mobile'
  | 'api'
  | 'documentation'
  | 'training'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending_customer'
  | 'pending_internal'
  | 'resolved'
  | 'closed'
  | 'cancelled'
  | 'reopened'
  | 'on_hold'
  | 'escalated';

// Comment Types
export interface Comment {
  _id: string;
  content: string;
  ticket: string;
  author: User;
  type:
    | 'comment'
    | 'status_change'
    | 'assignment'
    | 'escalation'
    | 'resolution'
    | 'internal_note'
    | 'system_message'
    | 'auto_response';
  visibility: 'public' | 'internal' | 'private';
  isInternal: boolean;
  isEdited: boolean;
  editHistory: EditHistory[];
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: Mention[];
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    source: 'web' | 'api' | 'email' | 'mobile' | 'system';
    formatting: 'plain' | 'markdown' | 'html';
  };
  aiAnalysis: {
    sentiment: {
      score: number;
      label:
        | 'very_negative'
        | 'negative'
        | 'neutral'
        | 'positive'
        | 'very_positive';
    };
    language: string;
    containsQuestion: boolean;
    urgencyLevel: 'low' | 'medium' | 'high';
    extractedKeywords: string[];
    suggestedActions: SuggestedAction[];
    processedAt: string;
  };
  parentComment?: string;
  replies: string[];
  isResolution: boolean;
  resolutionDetails?: {
    steps: ResolutionStep[];
    category:
      | 'workaround'
      | 'permanent_fix'
      | 'configuration'
      | 'user_error'
      | 'system_issue';
  };
  tags: string[];
  readBy: ReadReceipt[];
  isSystemGenerated: boolean;
  systemContext?: {
    event: string;
    data: Record<string, any>;
  };
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: User;
  deletionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  wordCount?: number;
  readingTimeMinutes?: number;
  reactionSummary?: Record<string, number>;
  replyCount?: number;
  ageInHours?: number;
}

// Supporting Interfaces
export interface Attachment {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedBy?: User;
  uploadedAt?: string;
  isPublic: boolean;
  downloadCount?: number;
}

export interface EscalationHistory {
  level: number;
  escalatedAt: string;
  escalatedBy: User;
  escalatedTo: User;
  reason: string;
}

export interface TicketHistoryEntry {
  action: string;
  performedBy: User;
  timestamp: string;
  details: Record<string, any>;
  comment?: string;
}

export interface Watcher {
  user: User;
  addedAt: string;
  notifications: boolean;
}

export interface RelatedTicket {
  ticket: Ticket;
  relationship:
    | 'duplicate'
    | 'related'
    | 'blocks'
    | 'blocked_by'
    | 'parent'
    | 'child';
  createdAt: string;
}

export interface CustomField {
  name: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
}

export interface EditHistory {
  originalContent: string;
  editedAt: string;
  editedBy: User;
  reason?: string;
}

export interface Reaction {
  user: User;
  type: 'like' | 'helpful' | 'thanks' | 'confused' | 'resolved';
  createdAt: string;
}

export interface Mention {
  user: User;
  position: {
    start: number;
    end: number;
  };
}

export interface SuggestedAction {
  action: 'escalate' | 'close' | 'reassign' | 'follow_up' | 'request_info';
  confidence: number;
}

export interface ResolutionStep {
  description: string;
  order: number;
}

export interface ReadReceipt {
  user: User;
  readAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter and Sort Types
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string[];
  customer?: string[];
  tags?: string[];
  createdFrom?: string;
  createdTo?: string;
  slaBreached?: boolean;
  search?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Dashboard Types
export interface DashboardStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    overdue: number;
  };
  sla: {
    responseBreaches: number;
    resolutionBreaches: number;
    averageResponseTime: number;
    averageResolutionTime: number;
  };
  workload: {
    myTickets: number;
    teamTickets: number;
    availableAgents: number;
    totalAgents: number;
  };
  trends: {
    ticketsCreated: number;
    ticketsResolved: number;
    customerSatisfaction: number;
    escalationRate: number;
  };
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  created: number;
  resolved: number;
  [key: string]: any;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department?: string;
  acceptTerms: boolean;
}

export interface CreateTicketForm {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  tags?: string[];
  attachments?: File[];
}

export interface UpdateTicketForm {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
  tags?: string[];
  dueDate?: string;
}

export interface CommentForm {
  content: string;
  isInternal?: boolean;
  attachments?: File[];
}

export interface UserProfileForm {
  name: string;
  email: string;
  profile: {
    phone?: string;
    department?: string;
    bio?: string;
  };
  skills: Skill[];
  availability: {
    workingHours: {
      start: string;
      end: string;
    };
    timezone: string;
    workingDays: string[];
  };
}

export interface UserSettingsForm {
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  workload: {
    maximum: number;
  };
}

// Notification Types
export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'ticket' | 'assignment' | 'escalation' | 'sla' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Socket Event Types
export interface SocketEvents {
  'ticket:created': (ticket: Ticket) => void;
  'ticket:updated': (ticket: Ticket) => void;
  'ticket:assigned': (data: { ticket: Ticket; assignee: User }) => void;
  'ticket:commented': (data: { ticket: Ticket; comment: Comment }) => void;
  'ticket:escalated': (data: { ticket: Ticket; escalation: any }) => void;
  'notification:new': (notification: Notification) => void;
  'user:status_changed': (data: { user: User; status: string }) => void;
}

// Error Types
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontSize: 'sm' | 'base' | 'lg';
}

// Store Types
export interface RootState {
  auth: AuthState;
  tickets: TicketState;
  users: UserState;
  notifications: NotificationState;
  ui: UiState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  filters: TicketFilters;
  sortBy: SortOptions;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export interface UiState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  modals: {
    [key: string]: boolean;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'ghost'
    | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export interface SelectProps extends BaseComponentProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  isMulti?: boolean;
  isSearchable?: boolean;
  onChange?: (value: any) => void;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRow?: (record: T, index: number) => Record<string, any>;
  emptyText?: string;
  sticky?: boolean;
}

// Export all types as a namespace as well
export namespace Types {
  export type User = User;
  export type Ticket = Ticket;
  export type Comment = Comment;
  export type ApiResponse<T> = ApiResponse<T>;
  export type PaginatedResponse<T> = PaginatedResponse<T>;
}
