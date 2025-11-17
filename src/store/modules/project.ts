import { defineStore } from "pinia";
import { store } from "@/store";
import type { Project, Task } from "@/types";

interface ProjectState {
  projects: Project[];
  tasks: Task[];
}

export const useProjectStore = defineStore("project", {
  state: (): ProjectState => ({
    projects: [],
    tasks: []
  }),
  actions: {
    setProjects(projects: Project[]) {
      this.projects = projects;
    },
    setTasks(tasks: Task[]) {
      this.tasks = tasks;
    },
    addProject(project: Project) {
      this.projects.push(project);
    },
    updateProject(project: Project) {
      const index = this.projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        this.projects[index] = project;
      }
    },
    deleteProject(id: string) {
      this.projects = this.projects.filter(p => p.id !== id);
    },
    addTask(task: Task) {
      this.tasks.push(task);
    },
    updateTask(task: Task) {
      const index = this.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.tasks[index] = task;
      }
    },
    deleteTask(id: string) {
      this.tasks = this.tasks.filter(t => t.id !== id);
    }
  },
  getters: {
    getProjectById: state => (id: string) => {
      return state.projects.find(p => p.id === id);
    },
    getTasksByProjectId: state => (projectId: string) => {
      return state.tasks.filter(t => t.projectId === projectId);
    }
  }
});

export function useProjectStoreHook() {
  return useProjectStore(store);
}
