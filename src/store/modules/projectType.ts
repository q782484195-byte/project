import { defineStore } from "pinia";
import { store } from "@/store";
import type { ProjectTypeConfig } from "@/types";
import { getAllProjectTypeConfigs } from "@/mock/projectTypes";

interface ProjectTypeState {
  projectTypes: ProjectTypeConfig[];
  currentProjectType: ProjectTypeConfig | null;
  loading: boolean;
}

export const useProjectTypeStore = defineStore("projectType", {
  state: (): ProjectTypeState => ({
    projectTypes: [],
    currentProjectType: null,
    loading: false
  }),
  getters: {
    allProjectTypes: state => state.projectTypes,
    getProjectTypeById: state => (id: string) => {
      return state.projectTypes.find(type => type.id === id);
    }
  },
  actions: {
    async loadProjectTypes() {
      this.loading = true;
      try {
        this.projectTypes = getAllProjectTypeConfigs();
      } finally {
        this.loading = false;
      }
    },
    setCurrentProjectType(projectType: ProjectTypeConfig | null) {
      this.currentProjectType = projectType;
    },
    addProjectType(projectType: ProjectTypeConfig) {
      this.projectTypes.push(projectType);
    },
    updateProjectType(projectType: ProjectTypeConfig) {
      const index = this.projectTypes.findIndex(t => t.id === projectType.id);
      if (index > -1) {
        this.projectTypes[index] = projectType;
      }
    },
    deleteProjectType(id: string) {
      this.projectTypes = this.projectTypes.filter(t => t.id !== id);
      if (this.currentProjectType?.id === id) {
        this.currentProjectType = null;
      }
    }
  }
});

export function useProjectTypeStoreHook() {
  return useProjectTypeStore(store);
}
