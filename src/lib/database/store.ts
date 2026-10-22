import {
  Opportunity,
  EligibilityRule,
  OpportunityDocument,
  DocumentItem,
  Journey,
  JourneyStep,
  JourneyStepStatus,
  DocumentStatus,
  UserDocumentState,
  StudentProfile,
  UserProfile,
} from "@/types/database";
import {
  INITIAL_OPPORTUNITIES,
  INITIAL_RULES,
  INITIAL_OPPORTUNITY_DOCUMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_INTERESTS,
  DEMO_STUDENT_USER,
  DEMO_STUDENT_PROFILE,
  DEMO_STUDENT_INTERESTS,
} from "./mockData";
import { generateDefaultJourneySteps, calculateJourneyProgress } from "../journeys/service";
import { isSupabaseConfigured, getSupabaseClient } from "./supabase";

// Storage keys for browser persistence
const STORAGE_OPPORTUNITIES = "nagriksetu_store_opportunities";
const STORAGE_RULES = "nagriksetu_store_rules";
const STORAGE_OPP_DOCS = "nagriksetu_store_opp_docs";
const STORAGE_DOCS = "nagriksetu_store_docs";
const STORAGE_JOURNEYS = "nagriksetu_store_journeys";
const STORAGE_DOC_STATUSES = "nagriksetu_store_doc_statuses";
const STORAGE_ADDITIONAL_ANSWERS = "nagriksetu_store_answers";
const STORAGE_PROFILES = "nagriksetu_store_student_profiles";

class DataStore {
  private opportunities: Opportunity[] = [...INITIAL_OPPORTUNITIES];
  private rules: EligibilityRule[] = [...INITIAL_RULES];
  private oppDocs: OpportunityDocument[] = [...INITIAL_OPPORTUNITY_DOCUMENTS];
  private documents: DocumentItem[] = [...INITIAL_DOCUMENTS];
  private journeys: Journey[] = [];
  private docStatuses: UserDocumentState[] = [];
  private additionalAnswers: Record<string, Record<string, any>> = {}; // userId -> { fieldKey: value }
  private studentProfiles: Record<string, StudentProfile> = {
    [DEMO_STUDENT_USER.id]: DEMO_STUDENT_PROFILE,
  };
  private isClientInitialized = false;

  constructor() {
    // Initial demo journey for demo student so dashboard isn't completely bare
    const defaultSteps = generateDefaultJourneySteps("demo_j_1", INITIAL_OPPORTUNITIES[0]);
    // Mark first two steps completed for demonstration
    defaultSteps[0].status = "COMPLETED";
    defaultSteps[1].status = "COMPLETED";
    defaultSteps[1].completedAt = new Date().toISOString();

    this.journeys = [
      {
        id: "demo_j_1",
        userId: DEMO_STUDENT_USER.id,
        opportunityId: INITIAL_OPPORTUNITIES[0].id,
        status: "IN_PROGRESS",
        progress: calculateJourneyProgress(defaultSteps),
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        opportunity: INITIAL_OPPORTUNITIES[0],
        steps: defaultSteps,
      },
    ];

    // Default document states for demo student
    this.docStatuses = [
      { id: "ds_1", userId: DEMO_STUDENT_USER.id, documentId: "doc_marksheet", status: "AVAILABLE", updatedAt: new Date().toISOString() },
      { id: "ds_2", userId: DEMO_STUDENT_USER.id, documentId: "doc_income", status: "MISSING", updatedAt: new Date().toISOString() },
      { id: "ds_3", userId: DEMO_STUDENT_USER.id, documentId: "doc_domicile", status: "AVAILABLE", updatedAt: new Date().toISOString() },
      { id: "ds_4", userId: DEMO_STUDENT_USER.id, documentId: "doc_bonafide", status: "AVAILABLE", updatedAt: new Date().toISOString() },
    ];
  }

  private initClientStorage() {
    if (typeof window === "undefined" || this.isClientInitialized) return;
    try {
      const savedOpps = localStorage.getItem(STORAGE_OPPORTUNITIES);
      if (savedOpps) this.opportunities = JSON.parse(savedOpps);

      const savedRules = localStorage.getItem(STORAGE_RULES);
      if (savedRules) this.rules = JSON.parse(savedRules);

      const savedDocs = localStorage.getItem(STORAGE_DOCS);
      if (savedDocs) this.documents = JSON.parse(savedDocs);

      const savedOppDocs = localStorage.getItem(STORAGE_OPP_DOCS);
      if (savedOppDocs) this.oppDocs = JSON.parse(savedOppDocs);

      const savedJourneys = localStorage.getItem(STORAGE_JOURNEYS);
      if (savedJourneys) this.journeys = JSON.parse(savedJourneys);

      const savedDocStatuses = localStorage.getItem(STORAGE_DOC_STATUSES);
      if (savedDocStatuses) this.docStatuses = JSON.parse(savedDocStatuses);

      const savedAnswers = localStorage.getItem(STORAGE_ADDITIONAL_ANSWERS);
      if (savedAnswers) this.additionalAnswers = JSON.parse(savedAnswers);

      const savedProfiles = localStorage.getItem(STORAGE_PROFILES);
      if (savedProfiles) this.studentProfiles = JSON.parse(savedProfiles);

      this.isClientInitialized = true;
    } catch (e) {
      console.warn("Could not read localStorage in DataStore", e);
    }
  }

  private saveToClient(key: string, data: any) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Could not save ${key} to localStorage`, e);
    }
  }

  // --- OPPORTUNITIES ---
  public async getOpportunities(filters?: {
    search?: string;
    type?: string;
    educationLevel?: string;
    state?: string;
    status?: string;
  }): Promise<Opportunity[]> {
    this.initClientStorage();
    let result = [...this.opportunities];

    if (filters?.type && filters.type !== "ALL") {
      result = result.filter((o) => o.type === filters.type);
    }

    if (filters?.educationLevel && filters.educationLevel !== "ALL") {
      result = result.filter(
        (o) =>
          o.educationLevelApplicability.length === 0 ||
          o.educationLevelApplicability.includes(filters.educationLevel as any)
      );
    }

    if (filters?.search && filters.search.trim() !== "") {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(term) ||
          (o.titleMr && o.titleMr.toLowerCase().includes(term)) ||
          o.provider.toLowerCase().includes(term) ||
          (o.providerMr && o.providerMr.toLowerCase().includes(term)) ||
          o.shortDescription.toLowerCase().includes(term)
      );
    }

    return result;
  }

  public async getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
    this.initClientStorage();
    return this.opportunities.find((o) => o.slug === slug) || null;
  }

  public async getOpportunityById(id: string): Promise<Opportunity | null> {
    this.initClientStorage();
    return this.opportunities.find((o) => o.id === id) || null;
  }

  public async createOpportunity(data: Omit<Opportunity, "id" | "createdAt" | "updatedAt">): Promise<Opportunity> {
    this.initClientStorage();
    const id = `opp_${Date.now()}`;
    const newOpp: Opportunity = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.opportunities.unshift(newOpp);
    this.saveToClient(STORAGE_OPPORTUNITIES, this.opportunities);
    return newOpp;
  }

  public async updateOpportunity(id: string, data: Partial<Opportunity>): Promise<Opportunity | null> {
    this.initClientStorage();
    const idx = this.opportunities.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.opportunities[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.opportunities[idx] = updated;
    this.saveToClient(STORAGE_OPPORTUNITIES, this.opportunities);
    return updated;
  }

  public async deleteOpportunity(id: string): Promise<boolean> {
    this.initClientStorage();
    const lenBefore = this.opportunities.length;
    this.opportunities = this.opportunities.filter((o) => o.id !== id);
    this.saveToClient(STORAGE_OPPORTUNITIES, this.opportunities);
    return this.opportunities.length < lenBefore;
  }

  // --- ELIGIBILITY RULES ---
  public async getRulesForOpportunity(oppId: string): Promise<EligibilityRule[]> {
    this.initClientStorage();
    return this.rules
      .filter((r) => r.opportunityId === oppId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public async createRule(data: Omit<EligibilityRule, "id">): Promise<EligibilityRule> {
    this.initClientStorage();
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRule: EligibilityRule = { ...data, id };
    this.rules.push(newRule);
    this.saveToClient(STORAGE_RULES, this.rules);
    return newRule;
  }

  public async deleteRule(id: string): Promise<boolean> {
    this.initClientStorage();
    const lenBefore = this.rules.length;
    this.rules = this.rules.filter((r) => r.id !== id);
    this.saveToClient(STORAGE_RULES, this.rules);
    return this.rules.length < lenBefore;
  }

  // --- DOCUMENTS ---
  public async getAllDocuments(): Promise<DocumentItem[]> {
    this.initClientStorage();
    return this.documents;
  }

  public async createDocument(data: Omit<DocumentItem, "id">): Promise<DocumentItem> {
    this.initClientStorage();
    const id = `doc_${Date.now()}`;
    const newDoc = { ...data, id };
    this.documents.push(newDoc);
    this.saveToClient(STORAGE_DOCS, this.documents);
    return newDoc;
  }

  public async getDocumentsForOpportunity(oppId: string): Promise<OpportunityDocument[]> {
    this.initClientStorage();
    const links = this.oppDocs.filter((od) => od.opportunityId === oppId);
    return links
      .map((link) => ({
        ...link,
        document: this.documents.find((d) => d.id === link.documentId),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public async addOpportunityDocument(oppId: string, documentId: string, required = true): Promise<OpportunityDocument> {
    this.initClientStorage();
    const id = `od_${Date.now()}`;
    const newLink: OpportunityDocument = {
      id,
      opportunityId: oppId,
      documentId,
      required,
      sortOrder: this.oppDocs.filter((o) => o.opportunityId === oppId).length + 1,
    };
    this.oppDocs.push(newLink);
    this.saveToClient(STORAGE_OPP_DOCS, this.oppDocs);
    return newLink;
  }

  public async removeOpportunityDocument(odId: string): Promise<boolean> {
    this.initClientStorage();
    const len = this.oppDocs.length;
    this.oppDocs = this.oppDocs.filter((o) => o.id !== odId);
    this.saveToClient(STORAGE_OPP_DOCS, this.oppDocs);
    return this.oppDocs.length < len;
  }

  // --- USER DOCUMENT STATUS ---
  public async getUserDocumentStatuses(userId: string): Promise<UserDocumentState[]> {
    this.initClientStorage();
    return this.docStatuses.filter((ds) => ds.userId === userId);
  }

  public async setUserDocumentStatus(
    userId: string,
    documentId: string,
    status: DocumentStatus
  ): Promise<UserDocumentState> {
    this.initClientStorage();
    const idx = this.docStatuses.findIndex(
      (ds) => ds.userId === userId && ds.documentId === documentId
    );
    const now = new Date().toISOString();

    if (idx >= 0) {
      this.docStatuses[idx].status = status;
      this.docStatuses[idx].updatedAt = now;
      this.saveToClient(STORAGE_DOC_STATUSES, this.docStatuses);
      return this.docStatuses[idx];
    } else {
      const newState: UserDocumentState = {
        id: `ds_${Date.now()}`,
        userId,
        documentId,
        status,
        updatedAt: now,
      };
      this.docStatuses.push(newState);
      this.saveToClient(STORAGE_DOC_STATUSES, this.docStatuses);
      return newState;
    }
  }

  // --- STORAGE MODE & PRODUCTION HEALTH ---
  public getStorageMode(): "supabase" | "demo_local" {
    return isSupabaseConfigured() ? "supabase" : "demo_local";
  }

  public isProductionMode(): boolean {
    return process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
  }

  public async deleteUserAccount(userId: string): Promise<boolean> {
    this.initClientStorage();
    if (!userId) return false;

    // Remove student profile
    delete this.studentProfiles[userId];
    this.saveToClient(STORAGE_PROFILES, this.studentProfiles);

    // Remove all journeys and steps for this user
    this.journeys = this.journeys.filter((j) => j.userId !== userId);
    this.saveToClient(STORAGE_JOURNEYS, this.journeys);

    // Remove document checklist statuses
    this.docStatuses = this.docStatuses.filter((ds) => ds.userId !== userId);
    this.saveToClient(STORAGE_DOC_STATUSES, this.docStatuses);

    // Remove additional questionnaire answers
    delete this.additionalAnswers[userId];
    this.saveToClient(STORAGE_ADDITIONAL_ANSWERS, this.additionalAnswers);

    return true;
  }

  // --- JOURNEYS ---
  public async getUserJourneys(userId: string): Promise<Journey[]> {
    this.initClientStorage();
    const userJourneys = this.journeys.filter((j) => j.userId === userId);
    return userJourneys.map((j) => ({
      ...j,
      opportunity: this.opportunities.find((o) => o.id === j.opportunityId),
    }));
  }

  public async getJourneyById(journeyId: string, requestingUserId?: string, userRole?: string): Promise<Journey | null> {
    this.initClientStorage();
    const journey = this.journeys.find((j) => j.id === journeyId);
    if (!journey) return null;

    // Cross-user IDOR guard: non-admin students can only access their own journeys
    if (requestingUserId && userRole !== "ADMIN" && journey.userId !== requestingUserId) {
      console.warn(`[Security Alert] IDOR attempt blocked: User ${requestingUserId} attempted to view Journey ${journeyId} owned by ${journey.userId}`);
      return null;
    }

    return {
      ...journey,
      opportunity: this.opportunities.find((o) => o.id === journey.opportunityId),
    };
  }

  public async createJourney(userId: string, oppId: string): Promise<Journey> {
    this.initClientStorage();
    // Check if already exists
    const existing = this.journeys.find(
      (j) => j.userId === userId && j.opportunityId === oppId
    );
    if (existing) return existing;

    const opp = this.opportunities.find((o) => o.id === oppId);
    if (!opp) throw new Error("Opportunity not found");

    // Guard: Prevent starting journeys on inactive or expired opportunities
    if (!opp.active || opp.verificationStatus === "EXPIRED") {
      throw new Error("Cannot start action journey for an inactive or expired opportunity");
    }

    const journeyId = `journey_${Date.now()}`;
    const steps = generateDefaultJourneySteps(journeyId, opp);
    const newJourney: Journey = {
      id: journeyId,
      userId,
      opportunityId: oppId,
      status: "IN_PROGRESS",
      progress: calculateJourneyProgress(steps),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      opportunity: opp,
      steps,
    };

    this.journeys.unshift(newJourney);
    this.saveToClient(STORAGE_JOURNEYS, this.journeys);
    return newJourney;
  }

  public async updateJourneyStepStatus(
    journeyId: string,
    stepId: string,
    status: JourneyStepStatus,
    requestingUserId?: string,
    userRole?: string
  ): Promise<Journey | null> {
    this.initClientStorage();
    const jIdx = this.journeys.findIndex((j) => j.id === journeyId);
    if (jIdx === -1) return null;

    const journey = this.journeys[jIdx];

    // Cross-user IDOR guard: non-admin students cannot modify other students' journeys
    if (requestingUserId && userRole !== "ADMIN" && journey.userId !== requestingUserId) {
      console.warn(`[Security Alert] IDOR attempt blocked: User ${requestingUserId} attempted to mutate Journey ${journeyId} owned by ${journey.userId}`);
      return null;
    }

    if (!journey.steps) return null;

    const sIdx = journey.steps.findIndex((s) => s.id === stepId);
    if (sIdx === -1) return null;

    journey.steps[sIdx].status = status;
    journey.steps[sIdx].completedAt = status === "COMPLETED" ? new Date().toISOString() : null;

    // Recalculate overall progress
    journey.progress = calculateJourneyProgress(journey.steps);
    journey.status = journey.progress === 100 ? "COMPLETED" : "IN_PROGRESS";
    journey.updatedAt = new Date().toISOString();

    this.journeys[jIdx] = { ...journey };
    this.saveToClient(STORAGE_JOURNEYS, this.journeys);
    return this.journeys[jIdx];
  }

  // --- ADDITIONAL PROFILE ANSWERS ---
  public async getAdditionalAnswers(userId: string): Promise<Record<string, any>> {
    this.initClientStorage();
    return this.additionalAnswers[userId] || {};
  }

  public async saveAdditionalAnswer(userId: string, fieldKey: string, value: any): Promise<void> {
    this.initClientStorage();
    if (!this.additionalAnswers[userId]) {
      this.additionalAnswers[userId] = {};
    }
    this.additionalAnswers[userId][fieldKey] = value;
    this.saveToClient(STORAGE_ADDITIONAL_ANSWERS, this.additionalAnswers);
  }

  // --- STUDENT PROFILES ---
  public async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    this.initClientStorage();
    return this.studentProfiles[userId] || null;
  }

  public async saveStudentProfile(userId: string, profile: Partial<StudentProfile>): Promise<StudentProfile> {
    this.initClientStorage();
    const existing = this.studentProfiles[userId];
    const now = new Date().toISOString();
    const updated: StudentProfile = {
      id: existing?.id || `profile_${Date.now()}`,
      userId,
      educationLevel: profile.educationLevel || "Diploma",
      currentYear: profile.currentYear || "Final Year",
      state: profile.state || "Maharashtra",
      district: profile.district || "Pune",
      incomeRange: profile.incomeRange || "1_TO_2_5_LAKH",
      incomeMin: profile.incomeMin ?? 100000,
      incomeMax: profile.incomeMax ?? 250000,
      academicPercentage: profile.academicPercentage ?? existing?.academicPercentage,
      category: profile.category ?? existing?.category ?? "General",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.studentProfiles[userId] = updated;
    this.saveToClient(STORAGE_PROFILES, this.studentProfiles);
    return updated;
  }

  // --- ADMIN METRICS ---
  public async getAdminMetrics() {
    this.initClientStorage();
    const activeOpps = this.opportunities.filter((o) => o.active).length;
    const expiringSoon = this.opportunities.filter((o) => {
      const days = Math.round((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;
    const activeJourneys = this.journeys.filter((j) => j.status === "IN_PROGRESS").length;
    const needsReview = this.opportunities.filter((o) => o.verificationStatus === "NEEDS_REVIEW").length;

    return {
      totalStudents: Object.keys(this.studentProfiles).length + 42, // demo baseline
      activeOpportunities: activeOpps,
      expiringSoon,
      activeJourneys: activeJourneys + 18,
      opportunitiesNeedingVerification: needsReview,
    };
  }
}

// Global singleton instance for client & server
export const dataStore = new DataStore();
