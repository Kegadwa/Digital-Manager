"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  collection
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, Transaction, Note, FileItem, Project, Category, PaymentMethod, ProjectActivity, PortfolioProject, Experience, Education, Certification, Tool, DesignProject } from "@/types";

export const KEYS = {
  tasks: "dh_tasks",
  transactions: "dh_transactions",
  notes: "dh_notes",
  files: "dh_files",
  projects: "dh_projects",
  categories: "dh_categories",
  methods: "dh_methods",
  seeded: "dh_seeded",
  // Portfolio keys
  portfolioAbout: "p_about",
  portfolioProjects: "p_projects",
  portfolioExperience: "p_experience",
  portfolioEducation: "p_education",
  portfolioCertifications: "p_certifications",
  portfolioTestimonials: "p_testimonials",
  portfolioSocial: "p_social",
  portfolioTools: "p_tools",
  portfolioDesignProjects: "p_design_projects",
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Salary", type: "income", color: "#2ECC71" },
  { id: "2", name: "Freelance", type: "income", color: "#3498DB" },
  { id: "3", name: "Investments", type: "income", color: "#F1C40F" },
  { id: "4", name: "Rent", type: "expense", color: "#E74C3C" },
  { id: "5", name: "Groceries", type: "expense", color: "#E67E22" },
  { id: "6", name: "Software", type: "expense", color: "#9B59B6" },
  { id: "7", name: "Utilities", type: "expense", color: "#95A5A6" },
  { id: "8", name: "Entertainment", type: "expense", color: "#34495E" },
];

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: "1", name: "Main Bank", type: "bank", color: "#0B1F3A", holder: "KEITH K.", last4: "4421" },
  { id: "2", name: "Visa Gold", type: "card", color: "#1A1A1A", holder: "KEITH K.", last4: "8892", brand: "visa", expiry: "12/28" },
  { id: "3", name: "M-Pesa", type: "wallet", color: "#2ECC71", holder: "KEITH K." },
];

function seedData() {
  const now = new Date().toISOString();
  return {
    [KEYS.tasks]: [
      { id: uid(), title: "Digital Hub initialized", status: "todo", priority: "medium", createdAt: now, subtasks: [] }
    ],
    [KEYS.transactions]: [],
    [KEYS.projects]: [],
    [KEYS.notes]: [],
    [KEYS.files]: [],
    [KEYS.portfolioAbout]: { short: "", full: "", detailed: "" },
    [KEYS.portfolioProjects]: [],
    [KEYS.portfolioExperience]: [],
    [KEYS.portfolioEducation]: [],
    [KEYS.portfolioCertifications]: [],
    [KEYS.portfolioTestimonials]: [],
    [KEYS.portfolioSocial]: [],
    [KEYS.portfolioTools]: [],
    [KEYS.portfolioDesignProjects]: [],
    [KEYS.categories]: DEFAULT_CATEGORIES,
    [KEYS.methods]: DEFAULT_METHODS,
  };
}

let seedingInProgress = false;

async function ensureSeed() {
  if (seedingInProgress) return;
  const seededDocRef = doc(db, "meta", "seeded");
  const snapshot = await getDoc(seededDocRef);
  if (snapshot.exists()) return;

  seedingInProgress = true;
  try {
    const seed = seedData();
    // Mark as seeded first to prevent double seeding
    await setDoc(seededDocRef, { value: true });
    
    // Seed each document in the 'data' collection
    for (const [key, value] of Object.entries(seed)) {
      await setDoc(doc(db, "data", key), { list: value });
    }
  } finally {
    seedingInProgress = false;
  }
}

function usePersistedList<T>(key: string): [T[], (next: T[] | ((prev: T[]) => T[])) => void] {
  const [list, setList] = useState<T[]>([]);

  useEffect(() => {
    ensureSeed().catch(console.error);
    const docRef = doc(db, "data", key);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (data && Array.isArray(data.list)) {
        setList(data.list);
      } else {
        setList([]);
      }
    });
    return () => unsubscribe();
  }, [key]);

  const update = useCallback((next: T[] | ((prev: T[]) => T[])) => {
    const docRef = doc(db, "data", key);
    setList((prev) => {
      const value = typeof next === "function" ? (next as (p: T[]) => T[])(prev) : next;
      const cleanValue = JSON.parse(JSON.stringify(value));
      setDoc(docRef, { list: cleanValue }).catch(console.error);
      return value;
    });
  }, [key]);

  return [list, update];
}

function usePersistedItem<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [item, setItem] = useState<T>(initial);

  useEffect(() => {
    ensureSeed().catch(console.error);
    const docRef = doc(db, "data", key);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data.item) {
        setItem(data.item);
      }
    });
    return () => unsubscribe();
  }, [key]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    const docRef = doc(db, "data", key);
    setItem((prev) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      const cleanValue = JSON.parse(JSON.stringify(value));
      setDoc(docRef, { item: cleanValue }).catch(console.error);
      return value;
    });
  }, [key]);

  return [item, update];
}

export function taskProgress(task: Task): number {
  if (task.status === "done") return 100;
  if (!task.subtasks?.length) return task.status === "in_progress" ? 50 : 0;
  const done = task.subtasks.filter((s) => s.done).length;
  return Math.round((done / task.subtasks.length) * 100);
}

export function useTasks() {
  const [tasks, setTasks] = usePersistedList<Task>(KEYS.tasks);
  const addTask = (t: Partial<Task>) => setTasks([{ ...t, id: uid(), createdAt: new Date().toISOString(), subtasks: [] } as Task, ...tasks]);
  const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t));
  const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const addSubtask = (taskId: string, title: string) => setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id: uid(), title, done: false }] } : t));
  const toggleSubtask = (taskId: string, subId: string) => setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) } : t));
  const removeSubtask = (taskId: string, subId: string) => setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subId) } : t));
  const updateTask = (id: string, updates: Partial<Task>) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  return { tasks, addTask, toggleTask, removeTask, addSubtask, toggleSubtask, removeSubtask, updateTask };
}

export function useTransactions() {
  const [transactions, setTransactions] = usePersistedList<Transaction>(KEYS.transactions);
  const addTransaction = (t: Partial<Transaction>) => setTransactions([{ ...t, id: uid() } as Transaction, ...transactions]);
  const removeTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));
  return { transactions, addTransaction, removeTransaction };
}

export function useNotes() {
  const [notes, setNotes] = usePersistedList<Note>(KEYS.notes);
  const addNote = (n: Partial<Note>) => setNotes([{ ...n, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Note, ...notes]);
  const removeNote = (id: string) => setNotes(notes.filter(n => n.id !== id));
  const togglePin = (id: string) => setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n));
  return { notes, addNote, removeNote, togglePin };
}

export function useFiles() {
  const [files, setFiles] = usePersistedList<FileItem>(KEYS.files);
  const addFile = (f: Partial<FileItem>) => setFiles([{ ...f, id: uid(), modifiedAt: new Date().toISOString() } as FileItem, ...files]);
  const removeFile = (id: string) => setFiles(files.filter(f => f.id !== id));
  const toggleStar = (id: string) => setFiles(files.map(f => f.id === id ? { ...f, starred: !f.starred } : f));
  return { files, addFile, removeFile, toggleStar };
}

export function useProjects() {
  const [projects, setProjects] = usePersistedList<Project>(KEYS.projects);
  const addProject = (p: Partial<Project>) => setProjects([{ ...p, id: uid(), activities: [], createdAt: new Date().toISOString() } as Project, ...projects]);
  const removeProject = (id: string) => setProjects(projects.filter(p => p.id !== id));
  const updateProject = (id: string, updates: Partial<Project>) => setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  const addActivity = (id: string, a: Omit<ProjectActivity, "id" | "createdAt">) => setProjects(projects.map(p => p.id === id ? { ...p, activities: [{ ...a, id: uid(), createdAt: new Date().toISOString() }, ...p.activities] } : p));
  return { projects, addProject, removeProject, updateProject, addActivity };
}

export function useCategories() {
  const [categories, setCategories] = usePersistedList<Category>(KEYS.categories);
  const addCategory = (c: Partial<Category>) => setCategories([{ ...c, id: uid() } as Category, ...categories]);
  const removeCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));
  return { categories, addCategory, removeCategory };
}

export function usePaymentMethods() {
  const [methods, setMethods] = usePersistedList<PaymentMethod>(KEYS.methods);
  const addMethod = (m: Partial<PaymentMethod>) => setMethods([{ ...m, id: uid() } as PaymentMethod, ...methods]);
  const removeMethod = (id: string) => setMethods(methods.filter(m => m.id !== id));
  return { methods, addMethod, removeMethod };
}

export function usePortfolio() {
  const [about, setAbout] = usePersistedItem(KEYS.portfolioAbout, { short: "", full: "", detailed: "" });
  const [projects, setProjects] = usePersistedList<PortfolioProject>(KEYS.portfolioProjects);
  const [experience, setExperience] = usePersistedList<Experience>(KEYS.portfolioExperience);
  const [education, setEducation] = usePersistedList<Education>(KEYS.portfolioEducation);
  const [certifications, setCertifications] = usePersistedList<Certification>(KEYS.portfolioCertifications);
  const [testimonials, setTestimonials] = usePersistedList<any>(KEYS.portfolioTestimonials);
  const [social, setSocial] = usePersistedList<any>(KEYS.portfolioSocial);
  const [tools, setTools] = usePersistedList<Tool>(KEYS.portfolioTools);

  const [designProjects, setDesignProjects] = usePersistedList<DesignProject>(KEYS.portfolioDesignProjects);
  const addItem = (list: any[], setList: (v: any[]) => void, item: any) => setList([{ ...item, id: uid() }, ...list]);
  const removeItem = (list: any[], setList: (v: any[]) => void, id: string) => setList(list.filter((i: any) => i.id !== id));
  const updateItem = (list: any[], setList: (v: any[]) => void, id: string, updates: any) => setList(list.map((i: any) => i.id === id ? { ...i, ...updates } : i));

  return {
    about, setAbout,
    projects, setProjects, addProject: (p: any) => addItem(projects, setProjects, p), removeProject: (id: string) => removeItem(projects, setProjects, id), updateProject: (id: string, u: any) => updateItem(projects, setProjects, id, u),
    designProjects, setDesignProjects, addDesignProject: (p: any) => addItem(designProjects, setDesignProjects, p), removeDesignProject: (id: string) => removeItem(designProjects, setDesignProjects, id), updateDesignProject: (id: string, u: any) => updateItem(designProjects, setDesignProjects, id, u),
    experience, setExperience, addExperience: (e: Partial<Experience>) => addItem(experience, setExperience, e), removeExperience: (id: string) => removeItem(experience, setExperience, id), updateExperience: (id: string, u: Partial<Experience>) => updateItem(experience, setExperience, id, u),
    education, setEducation, addEducation: (e: Partial<Education>) => addItem(education, setEducation, e), removeEducation: (id: string) => removeItem(education, setEducation, id), updateEducation: (id: string, u: Partial<Education>) => updateItem(education, setEducation, id, u),
    certifications, setCertifications, addCertification: (c: Partial<Certification>) => addItem(certifications, setCertifications, c), removeCertification: (id: string) => removeItem(certifications, setCertifications, id), updateCertification: (id: string, u: Partial<Certification>) => updateItem(certifications, setCertifications, id, u),
    testimonials, setTestimonials, addTestimonial: (t: any) => addItem(testimonials, setTestimonials, t), removeTestimonial: (id: string) => removeItem(testimonials, setTestimonials, id), updateTestimonial: (id: string, u: any) => updateItem(testimonials, setTestimonials, id, u),
    social, setSocial, addSocial: (s: any) => addItem(social, setSocial, s), removeSocial: (id: string) => removeItem(social, setSocial, id), updateSocial: (id: string, u: any) => updateItem(social, setSocial, id, u),
    tools, setTools, addTool: (t: Partial<Tool>) => addItem(tools, setTools, t), removeTool: (id: string) => removeItem(tools, setTools, id), updateTool: (id: string, u: Partial<Tool>) => updateItem(tools, setTools, id, u),
  };
}
