import { defineStore } from "pinia";
import { store } from "@/store";
import type { ProjectTemplate } from "@/types";
import { getAllProjectTemplates } from "@/mock/projectTemplates";

interface ProjectTemplateState {
  templates: ProjectTemplate[];
  currentTemplate: ProjectTemplate | null;
  loading: boolean;
}

export const useProjectTemplateStore = defineStore("projectTemplate", {
  state: (): ProjectTemplateState => ({
    templates: [],
    currentTemplate: null,
    loading: false
  }),
  getters: {
    allTemplates: state => state.templates,
    getTemplateById: state => (id: string) => {
      return state.templates.find(template => template.id === id);
    },
    getTemplatesByTypeId: state => (typeId: string) => {
      return state.templates.filter(template => template.typeId === typeId);
    }
  },
  actions: {
    async loadTemplates() {
      this.loading = true;
      try {
        this.templates = getAllProjectTemplates();
      } finally {
        this.loading = false;
      }
    },
    setCurrentTemplate(template: ProjectTemplate | null) {
      this.currentTemplate = template;
    },
    addTemplate(template: ProjectTemplate) {
      this.templates.push(template);
    },
    updateTemplate(template: ProjectTemplate) {
      const index = this.templates.findIndex(t => t.id === template.id);
      if (index > -1) {
        this.templates[index] = template;
      }
    },
    deleteTemplate(id: string) {
      this.templates = this.templates.filter(t => t.id !== id);
      if (this.currentTemplate?.id === id) {
        this.currentTemplate = null;
      }
    }
  }
});

export function useProjectTemplateStoreHook() {
  return useProjectTemplateStore(store);
}
