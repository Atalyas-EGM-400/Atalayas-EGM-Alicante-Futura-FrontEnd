import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://zoological-passion-atalayas.up.railway.app";
/*const BASE_URL = "http://localhost:3000"*/

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
    PROFILE: `${BASE_URL}/auth/profile`,
  },
  USERS: {
    GET_ALL: `${BASE_URL}/users`,
    CREATE: `${BASE_URL}/users`,
    ONBOARDING_DONE: `${BASE_URL}/users/me/onboarding-done`,
  },
  COURSES: {
    GET_ALL: `${BASE_URL}/courses`,
    CREATE: `${BASE_URL}/courses`,
    GET_BY_ID: (id: string) => `${BASE_URL}/courses/${id}`,
    UPDATE: (id: string) => `${BASE_URL}/courses/${id}`,
  },
  DOCUMENTS: {
    GET_ALL: `${BASE_URL}/document`,
  },
  SERVICES: {
    GET_ALL: `${BASE_URL}/services`,
    CREATE: `${BASE_URL}/services`,
    GET_BY_ID: (id: string) => `${BASE_URL}/services/${id}`,
  },
  COMPANIES: {
    GET_ALL: `${BASE_URL}/company`,
    GET_BY_ID: (id: string) => `${BASE_URL}/company/${id}`,
    DELETE: (id: string) => `${BASE_URL}/company/${id}`,
  },
  CONTENT: {
    GET_ALL: (courseId: string) => `${BASE_URL}/courses/${courseId}/content`,
    CREATE: (courseId: string) => `${BASE_URL}/courses/${courseId}/content`,
    GET_BY_ID: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}`,
    COMPLETE: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}/complete`,
    UPDATE: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}`,
    DELETE: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}`,
    VIEW: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}/view`,
    COMPLETE_LAB: (courseId: string, contentId: string) =>
      `${BASE_URL}/courses/${courseId}/content/${contentId}/complete-lab`,
  },
  ANNOUNCEMENTS: {
    GET_ALL: `${BASE_URL}/announcement`,
    CREATE: `${BASE_URL}/announcement`,
    GET_BY_ID: (id: string) => `${BASE_URL}/announcement/${id}`,
    UPDATE: (id: string) => `${BASE_URL}/announcement/${id}`,
    DELETE: (id: string) => `${BASE_URL}/announcement/${id}`,
  },
  COMPANY_REQUESTS: {
    CREATE: `${BASE_URL}/company-request`,
    GET_ALL: `${BASE_URL}/company-request`,
    APPROVE: (id: string) => `${BASE_URL}/company-request/${id}/approve`,
    REJECT: (id: string) => `${BASE_URL}/company-request/${id}/reject`,
    ARCHIVE: (id: string) => `${BASE_URL}/company-request/${id}/archive`,
    UNARCHIVE: (id: string) => `${BASE_URL}/company-request/${id}/unarchive`,
    GET_ARCHIVED: `${BASE_URL}/company-request?archived=true`,
    GET_PENDING: `${BASE_URL}/company-request/pending-counts`
  },

  ONBOARDING: {
    SETUP: `${BASE_URL}/onboarding/setup`,
    ME: `${BASE_URL}/onboarding/me`,
    TOGGLE: `${BASE_URL}/onboarding/toggle`,
    EMPLOYEE: `${BASE_URL}/onboarding/employee`,
  },

  CHATBOT: {
    SEND: `${BASE_URL}/chatbot`,
  },

  ENROLLMENTS: {
    BASE: `${BASE_URL}/enrollment`,
    BULK: `${BASE_URL}/enrollment/bulk`,
  },

  SUGGESTIONS: {
    CREATE: `${BASE_URL}/suggestions`,

    GET_ALL: `${BASE_URL}/suggestions`,

    GET_MINE: `${BASE_URL}/suggestions/mine`,

    GET_ONE: (id: string) => `${BASE_URL}/suggestions/${id}`,

    RESPOND: (id: string) => `${BASE_URL}/suggestions/${id}/respond`,

    DELETE: (id: string) => `${BASE_URL}/suggestions/${id}`,
  },

  STATS: {
    GET_ADMIN: `${BASE_URL}/stats`,
    GET_GENERAL: `${BASE_URL}/stats/general`,
  },

  ACTIVITY: {
    GET_MY: (limit = 5) => `${BASE_URL}/activity/me?limit=${limit}`,
  },

  EVENTS: {
    CREATE: `${BASE_URL}/events`,
    GET_ALL: `${BASE_URL}/events`,
    GET_BY_ID: (id: string) => `${BASE_URL}/events/${id}`,
    UPDATE: (id: string) => `${BASE_URL}/events/${id}`,
    DELETE: (id: string) => `${BASE_URL}/events/${id}`,
  },

  NOTIFICATIONS: {
    RESET: `${BASE_URL}/notifications/reset-count`,
    COUNT: `${BASE_URL}/notifications/unread-count`,

  },

  COMMUNITY: {
    CREATE: `${BASE_URL}/community`,
    CREATE_WITH_UPLOAD: `${BASE_URL}/community/upload`, // Para cuando el General Admin sube un archivo local
    GET_ALL: `${BASE_URL}/community`,
    GET_TYPES: `${BASE_URL}/community/tipos`,          // El endpoint para alimentar el autocompletado y los botones de filtro
    GET_ONE: (id: string) => `${BASE_URL}/community/${id}`,
    UPDATE: (id: string) => `${BASE_URL}/community/${id}`,
    DELETE: (id: string) => `${BASE_URL}/community/${id}`,
  },
};

// Agrega esto al final de tu archivo @/lib/utils.ts

export async function fetchWithApiFallback(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    // Aquí puedes retornar un valor por defecto o lanzar el error
    throw error;
  }
}
